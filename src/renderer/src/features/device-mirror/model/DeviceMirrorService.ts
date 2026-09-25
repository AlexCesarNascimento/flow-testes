import type { DeviceMirrorPort } from '@/shared/lib/device-mirror';
import { MockDeviceAdapter } from '@/shared/lib/device-mirror';
import { useDeviceStore } from '@/entities/device';

// Adaptador ativo — trocado na inicialização do app via setAdapter()
let _adapter: DeviceMirrorPort = new MockDeviceAdapter();
let _cleanup: (() => void) | null = null;
let _canvas: HTMLCanvasElement | null = null;

export function setAdapter(adapter: DeviceMirrorPort): void {
  _adapter = adapter;
}

export function getAdapterName(): string {
  return _adapter.adapterName;
}

/** Registra o canvas do DeviceFrame para receber o stream */
export function setCanvas(canvas: HTMLCanvasElement | null): void {
  _canvas = canvas;
}

/** Inicia a observação de dispositivos. Chamar uma vez na inicialização do app. */
export async function init(): Promise<void> {
  const store = useDeviceStore.getState();

  _cleanup = await _adapter.watchDevices({
    onConnect: async (device) => {
      store.setConnecting(device.id, device.name);

      if (!_canvas) {
        store.setError('Canvas de vídeo não disponível.');
        return;
      }

      try {
        await _adapter.startStream(device.id, _canvas);
        store.setStreaming();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        store.setError(`Falha ao iniciar stream: ${message}`);
      }
    },

    onDisconnect: async () => {
      await _adapter.stopStream();
      store.setIdle();
    },
  });
}

/** Libera recursos — chamar ao encerrar o app */
export async function dispose(): Promise<void> {
  _cleanup?.();
  _cleanup = null;
  await _adapter.stopStream();
}
