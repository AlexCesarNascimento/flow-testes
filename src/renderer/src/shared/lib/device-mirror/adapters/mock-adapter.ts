import type { DetectedDevice, DeviceMirrorPort } from '../port';

const MOCK_DEVICE: DetectedDevice = {
  id: 'mock-android-01',
  name: 'Android Mock (Pixel 7)',
};

export class MockDeviceAdapter implements DeviceMirrorPort {
  readonly adapterName = 'MockDeviceAdapter';

  private _connectTimer: ReturnType<typeof setTimeout> | null = null;
  private _frameTimer: ReturnType<typeof setInterval> | null = null;
  private _animFrame = 0;

  async watchDevices(callbacks: {
    onConnect: (device: DetectedDevice) => void;
    onDisconnect: (deviceId: string) => void;
  }): Promise<() => void> {
    // Simula device conectando após 1.5s
    this._connectTimer = setTimeout(() => {
      callbacks.onConnect(MOCK_DEVICE);
    }, 1500);

    return () => {
      if (this._connectTimer) clearTimeout(this._connectTimer);
      callbacks.onDisconnect(MOCK_DEVICE.id);
    };
  }

  async startStream(_deviceId: string, canvas: HTMLCanvasElement): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    canvas.width = 360;
    canvas.height = 640;

    this._frameTimer = setInterval(() => {
      this._animFrame++;
      const t = this._animFrame * 0.03;

      // Fundo verde escuro animado
      ctx.fillStyle = '#1a3c2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header simulado
      ctx.fillStyle = '#1a5c45';
      ctx.fillRect(0, 0, canvas.width, 72);

      // Texto "Olá!" animado
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Olá! (dispositivo real)', 20, 44);

      // Pulso animado para indicar stream ao vivo
      const pulse = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
      ctx.beginPath();
      ctx.arc(canvas.width - 24, 24, 6, 0, Math.PI * 2);
      ctx.fill();

      // Label AO VIVO
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('AO VIVO', canvas.width - 70, 28);

      // Conteúdo simulado
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.fillText('Espelhamento ativo', 20, 120);
      ctx.fillStyle = '#a3a3a3';
      ctx.font = '12px sans-serif';
      ctx.fillText('(mock — sem device físico)', 20, 145);
    }, 33); // ~30 FPS
  }

  async stopStream(): Promise<void> {
    if (this._frameTimer) {
      clearInterval(this._frameTimer);
      this._frameTimer = null;
    }
    this._animFrame = 0;
  }
}
