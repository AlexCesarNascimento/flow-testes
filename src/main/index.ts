import { app, BrowserWindow, shell, session, ipcMain, net } from 'electron';
import { join } from 'path';

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

// Único domínio permitido para o handler fetch-arraybuffer
const ALLOWED_FETCH_ORIGIN = 'https://github.com';

// Faz download via net.fetch (sem restrição CORS); valida URL antes de buscar.
// Registrado antes de whenReady — invocado apenas pelo renderer após a janela existir.
ipcMain.handle(
  'fetch-arraybuffer',
  async (event, url: unknown): Promise<ArrayBuffer> => {
    // Garante que apenas o frame principal da janela principal pode invocar
    const mainWin = BrowserWindow.getAllWindows()[0];
    if (
      !mainWin ||
      event.senderFrame.routingId !== mainWin.webContents.mainFrame.routingId
    ) {
      throw new Error('Origem da requisição não autorizada');
    }

    if (typeof url !== 'string') throw new Error('url deve ser uma string');
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error('URL inválida');
    }
    if (parsed.protocol !== 'https:')
      throw new Error('Somente https: é permitido');
    if (!parsed.origin.startsWith(ALLOWED_FETCH_ORIGIN))
      throw new Error('Origem não permitida');

    const response = await net.fetch(url);
    if (!response.ok) {
      // URL não é incluída na mensagem ao renderer para evitar vazamento de path/tokens
      console.error(
        `[fetch-arraybuffer] HTTP ${response.status} ao baixar ${url}`,
      );
      throw new Error(`Falha ao baixar recurso: HTTP ${response.status}`);
    }
    return response.arrayBuffer();
  },
);

function configureUsbPermissions(): void {
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
    if (details.deviceType !== 'usb') return false;
    // Concede acesso USB apenas à origem do renderer confiável
    const devUrl = process.env['ELECTRON_RENDERER_URL'];
    const trustedOrigin = devUrl ?? 'file://';
    return (
      details.origin === trustedOrigin || details.origin.startsWith('file://')
    );
  });
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.on('ready-to-show', () => win.show());

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
    try {
      const { protocol } = new URL(url);
      if (protocol === 'https:' || protocol === 'http:') {
        shell.openExternal(url);
      }
    } catch {
      // URL inválida — ignora silenciosamente
    }
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    const devUrl = new URL(process.env['ELECTRON_RENDERER_URL']);
    const isLocalDev =
      (devUrl.hostname === '127.0.0.1' || devUrl.hostname === 'localhost') &&
      devUrl.protocol === 'http:';
    if (!isLocalDev)
      throw new Error(`ELECTRON_RENDERER_URL inválida: ${devUrl.origin}`);
    win.loadURL(devUrl.href);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  configureUsbPermissions(); // chamado uma vez, não a cada criação de janela
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
