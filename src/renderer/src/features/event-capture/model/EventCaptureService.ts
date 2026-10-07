import { appLaunchPatch } from '../lib/appLaunch';
import {
  ScreenObserver,
  screenDisplayName,
  type ScreenSignature,
} from '@/shared/lib/screen-signature';
import { getAdbPort } from '@/shared/lib/adb-runner';
import { useRecorderStore } from '@/entities/recorder';
import type { Step } from '@/entities/step';
import type { IEventCapturePort } from '../ports/IEventCapturePort';
import { AdbGetEventAdapter } from '../adapters/AdbGetEventAdapter';
import { initialStepFor, enrichmentPatch } from '../lib/eventToStep';
import { captureDeviceSnapshot } from '@/shared/lib/device-snapshot';

let _port: IEventCapturePort | null = null;
let _session = 0;
let _lastEventX: number | null = null;
let _lastEventY: number | null = null;
let _lastEventTs = 0;
const DEDUP_WINDOW_MS = 800;
const DEDUP_PROXIMITY_PX = 100;

function nextStepId(): number {
  const store = useRecorderStore.getState();
  const maxId = store.steps.reduce((m, s) => Math.max(m, s.id), 0);
  return maxId + 1;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function buildWaitForPageStep(
  screen: ScreenSignature,
  id: number,
  seconds: number,
): Step {
  const pkg = screen.packageName;
  return {
    id,
    type: 'waitForPage',
    label: `Reconhecer tela "${screenDisplayName(screen)}"`,
    screenSignature: screen,
    value: pkg,
    time: formatTime(seconds),
    selected: false,
    selectors: screen.anchors.map((a, index) => ({
      ...a,
      stability: a.type === 'text' ? 'medium' : 'stable',
      recommended: index === 0,
    })),
  };
}

export async function startCapture(): Promise<void> {
  const session = ++_session;
  const previous = _port;
  _port = null;
  await previous?.stopCapture();
  if (session !== _session) return;
  useRecorderStore.getState().setCaptureStatus('preparing');
  const observer = new ScreenObserver();
  let pendingLaunch: { id: number; sourcePackage: string } | null = null;
  let lastStep: { id: number; at: number } | null = null;
  const appendCapturedStep = (step: Step) => {
    const store = useRecorderStore.getState();
    const now = Date.now();
    if (lastStep)
      store.updateStep(lastStep.id, {
        delayAfterMs: Math.min(300_000, now - lastStep.at),
      });
    store.appendStep({ ...step, delayAfterMs: 0 });
    if (step.type === 'waitForPage') {
      const snapshot = captureDeviceSnapshot();
      if (snapshot) store.setScreenshot(step.id, snapshot);
    }
    lastStep = { id: step.id, at: now };
  };
  _lastEventX = _lastEventY = null;
  _lastEventTs = 0;
  try {
    const adbPort = getAdbPort();
    if (!adbPort) {
      console.warn(
        '[EventCapture] ADB ainda não conectado — captura será iniciada quando o device conectar.',
      );
      return;
    }

    const port = new AdbGetEventAdapter(adbPort);
    _port = port;

    await port.startCapture(
      (event) => {
        if (session !== _session) return;
        const store = useRecorderStore.getState();

        // Feedback visual imediato — ripple no canvas.
        if (event.displayWidth > 0 && event.displayHeight > 0) {
          store.pushCapturedPoint(
            event.x,
            event.y,
            event.displayWidth,
            event.displayHeight,
          );
        }

        if (!store.recording) return;

        // Dedup agressivo: qualquer evento com coordenada próxima (< 100px)
        // do último dentro de 800ms é considerado duplicata. Cobre multi-touch,
        // bounce do painel, e listeners duplicados (StrictMode).
        const now = Date.now();
        const dx =
          _lastEventX === null ? Infinity : Math.abs(event.x - _lastEventX);
        const dy =
          _lastEventY === null ? Infinity : Math.abs(event.y - _lastEventY);
        const recent = now - _lastEventTs < DEDUP_WINDOW_MS;
        const nearby = dx < DEDUP_PROXIMITY_PX && dy < DEDUP_PROXIMITY_PX;
        if (recent && nearby) {
          console.debug(
            `[EventCapture] duplicata ignorada: (${event.x},${event.y}) vs (${_lastEventX},${_lastEventY}) Δt=${now - _lastEventTs}ms Δxy=${dx},${dy}`,
          );
          return;
        }
        _lastEventX = event.x;
        _lastEventY = event.y;
        _lastEventTs = now;

        // 1) Cria o step imediatamente (pending=true → shimmer).
        const id = nextStepId();
        const step = initialStepFor(event, id, store.recordingSeconds);
        appendCapturedStep(step);
        pendingLaunch =
          event.gesture === 'tap' && event.fromLauncher && event.sourcePackage
            ? { id, sourcePackage: event.sourcePackage }
            : null;

        // 2) Enrichment async — atualiza o step quando o dump resolver.
        void event.enrich.then((enriched) => {
          if (session !== _session) return;
          const s = useRecorderStore.getState();
          const patch = enrichmentPatch(event, enriched);
          if (s.steps.find((item) => item.id === id)?.type !== 'launchApp')
            s.updateStep(id, patch);
        });
      },
      (screen, isLauncher) => {
        if (session !== _session) return;
        const store = useRecorderStore.getState();
        if (!store.recording) return;
        const captureStatus = screen ? 'ready' : 'error';
        if (store.captureStatus !== captureStatus)
          store.setCaptureStatus(captureStatus);
        if (isLauncher) {
          observer.observe(null);
          return;
        }
        const changed = observer.observe(screen);
        if (changed) {
          if (pendingLaunch) {
            const patch = appLaunchPatch(
              true,
              pendingLaunch.sourcePackage,
              changed.packageName,
            );
            if (patch) store.updateStep(pendingLaunch.id, patch);
            pendingLaunch = null;
          }
          appendCapturedStep(
            buildWaitForPageStep(changed, nextStepId(), store.recordingSeconds),
          );
        }
      },
    );
  } catch (error) {
    if (session === _session) {
      useRecorderStore.getState().stopRecording();
      useRecorderStore.getState().setCaptureStatus('error');
      console.error('[EventCapture] Falha ao iniciar captura:', error);
    }
  }
}

export async function stopCapture(): Promise<void> {
  ++_session;
  const port = _port;
  _port = null;
  _lastEventX = null;
  _lastEventY = null;
  _lastEventTs = 0;
  useRecorderStore.getState().setCaptureStatus('idle');
  await port?.stopCapture();
}
