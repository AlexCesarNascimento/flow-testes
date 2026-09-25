import { contextBridge, ipcRenderer } from 'electron';

// Expõe apenas os canais IPC explicitamente permitidos — sem passthrough genérico.
contextBridge.exposeInMainWorld('api', {
  fetchArrayBuffer: (url: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke('fetch-arraybuffer', url) as Promise<ArrayBuffer>,
});
