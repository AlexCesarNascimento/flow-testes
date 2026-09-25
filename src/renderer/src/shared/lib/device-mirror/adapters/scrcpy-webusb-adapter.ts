import {
  Adb,
  AdbDaemonTransport,
  type AdbCredentialStore,
  type AdbDaemonConnection,
  type AdbPrivateKey,
} from '@yume-chan/adb';
import {
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

// Scrcpy server v2.7 — deve corresponder ao AdbScrcpyOptions2_7
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
    const stored = this._load();
    for (const bytes of stored) {
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

// ─── Scrcpy server download / cache ──────────────────────────────────────────

async function fetchServerBytes(): Promise<Uint8Array> {
  const cached = sessionStorage.getItem('flowtest-scrcpy-server');
  if (cached) {
    const arr = JSON.parse(cached) as number[];
    return new Uint8Array(arr);
  }

  const res = await fetch(SCRCPY_SERVER_URL);
  if (!res.ok) throw new Error(`Falha ao baixar scrcpy-server: ${res.status}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Cache na sessão (o servidor é empurrado a cada conexão de qualquer forma)
  try {
    sessionStorage.setItem('flowtest-scrcpy-server', JSON.stringify(Array.from(bytes)));
  } catch {
    // Ignora se sessionStorage estiver cheio
  }

  return bytes;
}

function bytesToReadableStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
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
    if (!manager) throw new Error('WebUSB não suportado neste ambiente.');

    // Verifica dispositivos já conectados e autorizados
    const existing = await manager.getDevices();
    for (const backend of existing) {
      callbacks.onConnect({ id: backend.serial, name: backend.serial });
    }

    // Observa novos dispositivos
    this._watcher = new AdbWebUsbBackendWatcher((newSerial) => {
      if (newSerial) {
        callbacks.onConnect({ id: newSerial, name: newSerial });
      } else {
        // newSerial undefined = desconexão, mas o watcher não fornece o serial
        // Workaround: listar devices restantes e inferir quem saiu
        manager.getDevices().then((remaining) => {
          const remainingIds = new Set(remaining.map((d) => d.serial));
          if (!remainingIds.has(newSerial ?? '')) {
            callbacks.onDisconnect(newSerial ?? 'unknown');
          }
        });
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

    const devices = await manager.getDevices();
    const backend = devices.find((d) => d.serial === deviceId);
    if (!backend) throw new Error(`Device ${deviceId} não encontrado.`);

    // O tipo de ReadableWritablePair do @yume-chan/stream-extra é compatível em runtime
    // mas difere em generics strict entre libs — cast necessário
    const connection = (await backend.connect()) as unknown as AdbDaemonConnection;
    const transport = await AdbDaemonTransport.authenticate({
      serial: deviceId,
      connection,
      credentialStore: this._credentialStore,
    });

    const adb = new Adb(transport);

    // Baixa e empurra o servidor scrcpy para o device
    const serverBytes = await fetchServerBytes();
    await AdbScrcpyClient.pushServer(
      adb,
      // @ts-expect-error: AdbScrcpyClient.pushServer aceita ReadableStream<Uint8Array>
      bytesToReadableStream(serverBytes),
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
    if (!videoStream) throw new Error('Stream de vídeo não disponível.');

    // Configura o canvas
    canvas.width = videoStream.width || 360;
    canvas.height = videoStream.height || 640;

    const renderer = new BitmapVideoFrameRenderer(canvas);
    this._decoder = new WebCodecsVideoDecoder({
      codec: ScrcpyVideoCodecId.H264,
      renderer,
    });

    this._abortController = new AbortController();

    // Conecta o stream ao decoder (não-bloqueante)
    videoStream.stream
      .pipeTo(this._decoder.writable, { signal: this._abortController.signal })
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[ScrcpyAdapter] Erro no stream:', err);
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
