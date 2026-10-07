import { resolveUiElement } from '@/shared/lib/ui-hierarchy';
import { adbCommand, readUiDump } from '@/shared/lib/adb-ui';
import {
  screenSignature,
  type ScreenSignature,
} from '@/shared/lib/screen-signature';
import type { Adb, AdbNoneProtocolProcess } from '@yume-chan/adb';
import type { IAdbPort } from '@/shared/lib/adb-runner';
import type {
  IEventCapturePort,
  CapturedEvent,
  CapturedGesture,
} from '../ports/IEventCapturePort';
import { parseGetEventLine } from '../lib/parseGetEvent';
import { parseUiDump, findElementAt, type UiElement } from '../lib/parseUiDump';
import {
  getDisplaySize,
  findTouchDevice,
  type DisplayInfo,
  type InputDevice,
} from '../lib/deviceInfo';

const LONG_PRESS_MS = 500;
const SWIPE_MIN_DISTANCE_PX = 24;
const CACHE_MAX_AGE_MS = 4000;
const BACKGROUND_POLL_MS = 350;

type GestureState = {
  downTs: number;
  startX: number | null;
  startY: number | null;
  lastX: number | null;
  lastY: number | null;
  snapshot: UiElement[];
};

function freshGesture(): GestureState {
  return {
    downTs: 0,
    startX: null,
    startY: null,
    lastX: null,
    lastY: null,
    snapshot: [],
  };
}

export class AdbGetEventAdapter implements IEventCapturePort {
  private _process: AdbNoneProtocolProcess | null = null;
  private _running = false;

  private _display: DisplayInfo | null = null;
  private _inputDevice: InputDevice | null = null;
  private _scaleX = 1;
  private _scaleY = 1;

  private _lastDumpPromise: Promise<UiElement[]> | null = null;
  // Cache do último dump bem-sucedido — snapshot da tela ANTES do próximo tap.
  // Sem isso, `uiautomator dump` bloqueia esperando UI idle e retorna a tela
  // SEGUINTE ao tap (porque o app já navegou enquanto dumpava).
  private _cachedDump: UiElement[] = [];
  private _cachedAt = 0;
  private _onScreen?: (
    screen: ScreenSignature | null,
    isLauncher?: boolean,
  ) => void;
  private _abort = new AbortController();
  private _gestureRevision = 0;
  private _touching = false;
  private _homePackage: string | null = null;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly _adbPort: IAdbPort) {}

  async startCapture(
    onEvent: (event: CapturedEvent) => void,
    onScreen?: (screen: ScreenSignature | null, isLauncher?: boolean) => void,
  ): Promise<void> {
    this._onScreen = onScreen;
    const adb = this._adbPort.getAdb();
    if (!adb) {
      console.warn('[EventCapture] ADB indisponível — captura desligada.');
      return;
    }

    // Probe do device: tela + touchscreen. Se falhar, tenta capturar mesmo assim
    // com escala 1:1 (útil em devices onde o painel já reporta em pixels de tela).
    [this._display, this._inputDevice] = await Promise.all([
      getDisplaySize(adb),
      findTouchDevice(adb),
    ]);

    try {
      const home = await adbCommand(
        adb,
        [
          'cmd',
          'package',
          'resolve-activity',
          '--brief',
          '-a',
          'android.intent.action.MAIN',
          '-c',
          'android.intent.category.HOME',
        ],
        this._abort.signal,
        3000,
      );
      this._homePackage = home.match(/([\w.]+)\/[\w.$]+/)?.[1] ?? null;
    } catch {
      /* Sem launcher resolvido, não inferimos abertura de app. */
    }
    if (this._abort.signal.aborted) return;

    if (this._display && this._inputDevice) {
      this._scaleX = this._display.width / this._inputDevice.maxX;
      this._scaleY = this._display.height / this._inputDevice.maxY;
      console.info(
        `[EventCapture] display=${this._display.width}x${this._display.height} ` +
          `touch=${this._inputDevice.path} panel=${this._inputDevice.maxX}x${this._inputDevice.maxY} ` +
          `scale=${this._scaleX.toFixed(3)}x${this._scaleY.toFixed(3)}`,
      );
    } else {
      console.warn(
        '[EventCapture] Probe incompleto (display=%o, input=%o) — assumindo escala 1:1',
        this._display,
        this._inputDevice,
      );
    }

    const args = this._inputDevice
      ? ['getevent', '-lt', this._inputDevice.path]
      : ['getevent', '-lt'];

    this._running = true;

    // Pré-fetch: assinatura da tela ANTES do primeiro tap.
    console.info('[EventCapture] pré-fetch da assinatura da tela…');
    void this._triggerDump(adb).then((els) => {
      console.info(`[EventCapture] assinatura pronta: ${els.length} elementos`);
    });

    // Poller em background: mantém o cache "quente" com a tela atual.
    // Como uiautomator dump aguarda UI idle, ele fica bloqueado durante
    // navegação e volta com a tela nova quando estabiliza — perfeito para
    // o próximo tap encontrar a tela certa no cache.
    this._pollTimer = setInterval(() => {
      if (!this._running) return;
      void this._triggerDump(adb);
    }, BACKGROUND_POLL_MS);

    try {
      this._process = await adb.subprocess.noneProtocol.spawn(args);
    } catch (err) {
      console.error('[EventCapture] Falha ao iniciar getevent:', err);
      await this.stopCapture();
      throw err;
    }

    if (!this._running) {
      await this._process.kill();
      return;
    }
    void this._readLoop(adb, this._process, onEvent);
  }

  async stopCapture(): Promise<void> {
    this._running = false;
    this._abort.abort();
    this._onScreen = undefined;
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    this._cachedDump = [];
    this._cachedAt = 0;
    try {
      await this._process?.kill();
    } catch {
      // device already disconnected
    }
    this._process = null;
  }

  private async _readLoop(
    adb: Adb,
    proc: AdbNoneProtocolProcess,
    onEvent: (event: CapturedEvent) => void,
  ): Promise<void> {
    const decoder = new TextDecoder();
    const reader = proc.output.getReader();
    let buf = '';
    let gesture = freshGesture();

    try {
      while (this._running) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          const ev = parseGetEventLine(line);
          if (!ev) continue;

          if (ev.kind === 'finger_down') {
            gesture = freshGesture();
            gesture.downTs = ev.ts;
            // Dispara dump imediatamente para capturar o estado da tela
            // ANTES da UI reagir ao toque.
            this._touching = true;
            this._gestureRevision++;
            gesture.snapshot =
              Date.now() - this._cachedAt < CACHE_MAX_AGE_MS
                ? this._cachedDump
                : [];
          } else if (ev.kind === 'pos_x') {
            gesture.lastX = ev.value;
            if (gesture.startX === null) gesture.startX = ev.value;
          } else if (ev.kind === 'pos_y') {
            gesture.lastY = ev.value;
            if (gesture.startY === null) gesture.startY = ev.value;
          } else if (ev.kind === 'finger_up') {
            this._touching = false;
            this._gestureRevision++;
            this._processGesture(gesture, ev.ts, onEvent);
            void this._triggerDump(adb);
            gesture = freshGesture();
          }
        }
      }
    } catch (err) {
      if (this._running) {
        console.error('[EventCapture] Erro no stream getevent:', err);
      }
    } finally {
      reader.releaseLock();
    }
  }

  private _processGesture(
    g: GestureState,
    upTs: number,
    onEvent: (event: CapturedEvent) => void,
  ): void {
    if (
      g.downTs === 0 ||
      g.startX === null ||
      g.startY === null ||
      g.lastX === null ||
      g.lastY === null
    ) {
      return;
    }

    const durationMs = Math.max(0, (upTs - g.downTs) * 1000);
    const startX = Math.round(g.startX * this._scaleX);
    const startY = Math.round(g.startY * this._scaleY);
    const endX = Math.round(g.lastX * this._scaleX);
    const endY = Math.round(g.lastY * this._scaleY);
    const distance = Math.hypot(endX - startX, endY - startY);

    let gestureKind: CapturedGesture;
    if (distance >= SWIPE_MIN_DISTANCE_PX) gestureKind = 'swipe';
    else if (durationMs >= LONG_PRESS_MS) gestureKind = 'longPress';
    else gestureKind = 'tap';

    // Emissão OTIMISTA: entrega o evento imediatamente com coordenadas.
    // O enriquecimento (resource-id, text, etc.) chega via Promise `enrich`
    // — o consumer atualiza o step quando ela resolver.
    const enrich = this._resolveElement(g.snapshot, startX, startY);

    const captured: CapturedEvent = {
      gesture: gestureKind,
      sourcePackage: screenSignature(g.snapshot)?.packageName,
      fromLauncher:
        !!this._homePackage &&
        screenSignature(g.snapshot)?.packageName === this._homePackage,
      x: endX,
      y: endY,
      startX: gestureKind === 'swipe' ? startX : undefined,
      startY: gestureKind === 'swipe' ? startY : undefined,
      durationMs: Math.round(durationMs),
      displayWidth: this._display?.width ?? 0,
      displayHeight: this._display?.height ?? 0,
      enrich,
    };

    console.debug(
      `[EventCapture] ${gestureKind} @ (${startX},${startY})→(${endX},${endY}) ` +
        `${durationMs.toFixed(0)}ms (enrichment em background)`,
    );

    if (this._running) onEvent(captured);
  }

  private async _resolveElement(
    elements: UiElement[],
    x: number,
    y: number,
  ): Promise<import('../ports/IEventCapturePort').EnrichedFields | null> {
    const el = findElementAt(elements, x, y);
    if (!el) {
      console.debug(
        `[EventCapture] enrichment: (${x},${y}) não achou elemento em ${elements.length} nodes`,
      );
      return null;
    }
    try {
      resolveUiElement(elements, [
        ...(el.resourceId
          ? [{ type: 'resourceId', value: el.resourceId }]
          : []),
        ...(el.contentDesc
          ? [{ type: 'accessibilityId', value: el.contentDesc }]
          : []),
        ...(el.text ? [{ type: 'text', value: el.text }] : []),
      ]);
    } catch {
      return null;
    }
    return {
      resourceId: el.resourceId,
      contentDesc: el.contentDesc,
      text: el.text,
      className: el.className,
      packageName: el.packageName,
      editable: el.editable,
      kind: el.kind,
    };
  }

  /** Nunca inicia dumps concorrentes sobre o mesmo transporte. */
  private _triggerDump(adb: Adb): Promise<UiElement[]> {
    if (this._lastDumpPromise) return this._lastDumpPromise;
    this._lastDumpPromise = this._doDump(adb).finally(() => {
      this._lastDumpPromise = null;
    });
    return this._lastDumpPromise;
  }

  private async _doDump(adb: Adb): Promise<UiElement[]> {
    const revision = this._gestureRevision;
    try {
      const xml = await readUiDump(adb, this._abort.signal);
      if (
        !this._running ||
        this._touching ||
        revision !== this._gestureRevision
      )
        return [];
      const elements = parseUiDump(xml);
      if (elements.length) {
        this._cachedDump = elements;
        this._cachedAt = Date.now();
      }
      const signature = screenSignature(elements);
      this._onScreen?.(
        signature,
        !!this._homePackage && signature?.packageName === this._homePackage,
      );
      return elements;
    } catch (err) {
      if (this._running) {
        this._onScreen?.(null);
        console.warn('[EventCapture] Não foi possível reconhecer a tela:', err);
      }
      return [];
    }
  }
}
