export interface DetectedDevice {
  id: string;
  name: string;
}

export interface DeviceMirrorPort {
  readonly adapterName: string;

  /**
   * Começa a observar conexões/desconexões de dispositivos.
   * Retorna uma função de cleanup para parar de observar.
   */
  watchDevices(callbacks: {
    onConnect: (device: DetectedDevice) => void;
    onDisconnect: (deviceId: string) => void;
  }): Promise<() => void>;

  /**
   * Inicia o espelhamento da tela do device no canvas fornecido.
   */
  startStream(deviceId: string, canvas: HTMLCanvasElement): Promise<void>;

  /**
   * Para o espelhamento e libera recursos.
   */
  stopStream(): Promise<void>;
}
