import { app, BrowserWindow, shell, session, ipcMain, net } from 'electron';
import { join } from 'path';

// Vendor IDs Android mais comuns (Google, Samsung, Xiaomi, Motorola, OnePlus, etc.)
const ANDROID_VENDOR_IDS = [
  0x18d1, // Google
  0x04e8, // Samsung
  0x2717, // Xiaomi
  0x22b8, // Motorola
  0x2a70, // OnePlus
  0x0b05, // ASUS
  0x04dd, // Sharp
  0x12d1, // Huawei
  0x1ebf, // Meizu
  0x19d2, // ZTE
  0x1d4d, // Pegatron
  0x0fce, // Sony Ericsson
  0x0489, // Foxconn
];

function configureUsbPermissions(): void {
  // Autoriza automaticamente dispositivos Android quando conectados
  session.defaultSession.on('select-usb-device', (event, details, callback) => {
    event.preventDefault();
    const android = details.deviceList.find((d) =>
      ANDROID_VENDOR_IDS.includes(d.vendorId),
    );
    callback(android?.deviceId ?? '');
  });

  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    if (permission === 'usb') return true;
    return null;
  });

  session.defaultSession.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'usb') return true;
    return false;
  });
}

function createWindow(): void {
  configureUsbPermissions();

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.on('ready-to-show', () => win.show());

  // Encaminha logs do renderer para o terminal durante desenvolvimento
  win.webContents.on(
    'console-message',
    (_event, level, message, line, sourceId) => {
      const prefix =
        [
          '[renderer:verbose]',
          '[renderer:info]',
          '[renderer:warn]',
          '[renderer:error]',
        ][level] ?? '[renderer]';
      const src = sourceId ? ` (${sourceId.split('/').pop()}:${line})` : '';
      if (level >= 2) {
        console.error(`${prefix}${src}`, message);
      } else {
        console.log(`${prefix}${src}`, message);
      }
    },
  );

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Faz download via net.fetch (sem restrição de CORS) e devolve ArrayBuffer ao renderer
ipcMain.handle(
  'fetch-arraybuffer',
  async (_event, url: string): Promise<ArrayBuffer> => {
    const response = await net.fetch(url);
    if (!response.ok)
      throw new Error(`HTTP ${response.status} ao baixar ${url}`);
    return response.arrayBuffer();
  },
);

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
