import type { DeviceMirrorPort } from '@/shared/lib/device-mirror';
import type { IAdbPort } from '@/shared/lib/adb-runner';
import { setAdbPort } from '@/shared/lib/adb-runner';
import { useDeviceStore } from '@/entities/device';
import { setSnapshotSource } from '@/shared/lib/device-snapshot';

let _adapter: DeviceMirrorPort | null = null;
let _cleanup: (() => void) | null = null;
let _canvas: HTMLCanvasElement | null = null;

export function setAdapter(adapter: DeviceMirrorPort): void {
  _adapter = adapter;
}

export function getAdapterName(): string {
  return _adapter?.adapterName ?? '(nenhum)';
}

export function setCanvas(canvas: HTMLCanvasElement | null): void {
  _canvas = canvas;
}

export async function init(): Promise<void> {
  if (!_adapter) {
    console.error(
      '[DeviceMirror] setAdapter() precisa ser chamado antes de init()',
    );
    return;
  }

  // Guarda contra dupla chamada sem dispose() intermediário (ex: StrictMode)
  if (_cleanup) {
    console.warn(
      '[DeviceMirror] init() chamado sem dispose() anterior — ignorando.',
    );
    return;
  }

  const store = useDeviceStore.getState();

  try {
    _cleanup = await _adapter.watchDevices({
      onConnect: async (device) => {
        setSnapshotSource(null);
        store.setConnecting(device.id, device.name);

        if (!_canvas) {
          store.setError('Canvas de vídeo não montado ainda.');
          return;
        }

        try {
          await _adapter!.startStream(device.id, _canvas);
          if (
            _adapter &&
            'getAdb' in _adapter &&
            typeof _adapter.getAdb === 'function'
          ) {
            setAdbPort(_adapter as DeviceMirrorPort & IAdbPort);
          }
          store.setStreaming();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('[DeviceMirror] startStream falhou:', err);
          store.setError(message);
        }
      },

      // Assinatura alinhada com o contrato de DeviceMirrorPort
      onDisconnect: () => {
        setSnapshotSource(null);
        _adapter!.stopStream().catch(() => {
          // ignora erro de stop — device já foi desconectado
        });
        setAdbPort(null);
        store.setIdle();
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DeviceMirror] watchDevices falhou:', err);
    store.setError(message);
  }
}

export async function dispose(): Promise<void> {
  setSnapshotSource(null);
  _cleanup?.();
  _cleanup = null;
  _canvas = null;
  setAdbPort(null);
  try {
    await _adapter?.stopStream();
  } catch {
    // ignora
  }
}
