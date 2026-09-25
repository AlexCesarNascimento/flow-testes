import {
  Adb,
  AdbDaemonTransport,
  type AdbCredentialStore,
  type AdbDaemonConnection,
  type AdbPrivateKey,
} from '@yume-chan/adb';
import {
  AdbWebUsbBackend,
  AdbWebUsbBackendManager,
  AdbWebUsbBackendWatcher,
} from '@yume-chan/adb-backend-webusb';
import { AdbScrcpyClient, AdbScrcpyOptions2_7 } from '@yume-chan/adb-scrcpy';
import { ScrcpyVideoCodecId } from '@yume-chan/scrcpy';
import {
  BitmapVideoFrameRenderer,
  WebCodecsVideoDecoder,
} from '@yume-chan/scrcpy-decoder-webcodecs';

import type { DetectedDevice, DeviceMirrorPort } from '../port';

const SCRCPY_SERVER_VERSION = '2.7';
const SCRCPY_SERVER_URL = `https://github.com/Genymobile/scrcpy/releases/download/v${SCRCPY_SERVER_VERSION}/scrcpy-server-v${SCRCPY_SERVER_VERSION}`;
const SCRCPY_SERVER_PATH = '/data/local/tmp/scrcpy-server.jar';

// ─── Credential store via localStorage ───────────────────────────────────────

class LocalStorageCredentialStore implements AdbCredentialStore {
  private static STORAGE_KEY = 'flowtest-adb-keys';

  async generateKey(): Promise<AdbPrivateKey> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: 'SHA-1',
      },
      true,
      ['sign'],
    );
    const exported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const key: AdbPrivateKey = { buffer: new Uint8Array(exported) };
    const stored = this._load();
    stored.push(Array.from(key.buffer));
    localStorage.setItem(LocalStorageCredentialStore.STORAGE_KEY, JSON.stringify(stored));
    return key;
  }

  *iterateKeys(): Iterable<AdbPrivateKey> {
    for (const bytes of this._load()) {
      yield { buffer: new Uint8Array(bytes) };
    }
  }

  private _load(): number[][] {
    try {
      return JSON.parse(localStorage.getItem(LocalStorageCredentialStore.STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
}

// ─── Scrcpy server: download e cache em memória ───────────────────────────────

let _serverBytesCache: Uint8Array | null = null;

async function fetchServerBytes(): Promise<Uint8Array> {
  if (_serverBytesCache) return _serverBytesCache;

  const res = await fetch(SCRCPY_SERVER_URL);
  if (!res.ok) throw new Error(`Falha ao baixar scrcpy-server v${SCRCPY_SERVER_VERSION}: HTTP ${res.status}`);

  const buf = await res.arrayBuffer();
  _serverBytesCache = new Uint8Array(buf);
  return _serverBytesCache;
}

function toReadableStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class ScrcpyWebUsbAdapter implements DeviceMirrorPort {
  readonly adapterName = 'ScrcpyWebUsbAdapter';

  private _credentialStore = new LocalStorageCredentialStore();
  private _watcher: AdbWebUsbBackendWatcher | null = null;
  private _client: AdbScrcpyClient<AdbScrcpyOptions2_7<true>> | null = null;
  private _decoder: WebCodecsVideoDecoder | null = null;
  private _abortController: AbortController | null = null;

  async watchDevices(callbacks: {
    onConnect: (device: DetectedDevice) => void;
    onDisconnect: (deviceId: string) => void;
  }): Promise<() => void> {
    const manager = AdbWebUsbBackendManager.BROWSER;
    if (!manager) throw new Error('WebUSB não disponível neste ambiente. Verifique se o app está rodando no Electron.');

    // Devices já autorizados em sessões anteriores
    const existing = await manager.getDevices();
    for (const backend of existing) {
      callbacks.onConnect({ id: backend.serial, name: backend.serial });
    }

    // Rastreia seriais conectados para detectar desconexões
    const connected = new Set(existing.map((d) => d.serial));

    this._watcher = new AdbWebUsbBackendWatcher(async (newSerial) => {
      if (newSerial) {
        // Device novo plugado — no Electron, requestDevice() é auto-aprovado
        // pelo handler select-usb-device configurado no main process
        if (!connected.has(newSerial)) {
          connected.add(newSerial);
          callbacks.onConnect({ id: newSerial, name: newSerial });
        }
      } else {
        // Callback sem serial = algum device foi desconectado
        // Descobre qual comparando a lista atual com a anterior
        try {
          const current = await manager.getDevices();
          const currentIds = new Set(current.map((d) => d.serial));
          for (const serial of connected) {
            if (!currentIds.has(serial)) {
              connected.delete(serial);
              callbacks.onDisconnect(serial);
            }
          }
        } catch {
          // Se getDevices falhar, limpa tudo
          for (const serial of connected) {
            callbacks.onDisconnect(serial);
          }
          connected.clear();
        }
      }
    }, navigator.usb);

    return () => {
      this._watcher?.dispose();
      this._watcher = null;
    };
  }

  async startStream(deviceId: string, canvas: HTMLCanvasElement): Promise<void> {
    const manager = AdbWebUsbBackendManager.BROWSER;
    if (!manager) throw new Error('WebUSB não disponível.');

    // Tenta encontrar o device na lista de autorizados
    let backend: AdbWebUsbBackend | undefined;
    const devices = await manager.getDevices();
    backend = devices.find((d) => d.serial === deviceId);

    // Se não estiver na lista (device novo no Electron), solicita seleção
    // O handler no main process auto-aprova dispositivos Android
    if (!backend) {
      backend = await manager.requestDevice();
      if (!backend) throw new Error(`Device ${deviceId} não pôde ser autorizado. Verifique a Depuração USB no Android.`);
    }

    const connection = (await backend.connect()) as unknown as AdbDaemonConnection;
    const transport = await AdbDaemonTransport.authenticate({
      serial: deviceId,
      connection,
      credentialStore: this._credentialStore,
    });

    const adb = new Adb(transport);

    // Baixa e empurra o scrcpy-server para o device
    const serverBytes = await fetchServerBytes();
    await AdbScrcpyClient.pushServer(
      adb,
      // @ts-expect-error: compatibilidade de tipos entre @yume-chan/stream-extra e ReadableStream nativo
      toReadableStream(serverBytes),
    );

    const options = new AdbScrcpyOptions2_7({
      video: true as const,
      videoCodec: 'h264',
      videoBitRate: 2_000_000,
      maxSize: 720,
      audio: false,
      control: false,
    });

    this._client = await AdbScrcpyClient.start(adb, SCRCPY_SERVER_PATH, options);

    const videoStream = await this._client.videoStream;
    if (!videoStream) throw new Error('Stream de vídeo não disponível — verifique as permissões do dispositivo.');

    canvas.width = videoStream.width || 360;
    canvas.height = videoStream.height || 640;

    const renderer = new BitmapVideoFrameRenderer(canvas);
    this._decoder = new WebCodecsVideoDecoder({
      codec: ScrcpyVideoCodecId.H264,
      renderer,
    });

    this._abortController = new AbortController();

    videoStream.stream
      .pipeTo(this._decoder.writable, { signal: this._abortController.signal })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[ScrcpyAdapter] Erro no stream de vídeo:', err);
        }
      });
  }

  async stopStream(): Promise<void> {
    this._abortController?.abort();
    this._abortController = null;
    this._decoder?.dispose();
    this._decoder = null;
    await this._client?.close();
    this._client = null;
  }
}
