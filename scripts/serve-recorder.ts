import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Renderer real em porta isolada para regressões do recorder no Electron.
const server = await createServer({
  configFile: false,
  root: resolve('src/renderer'),
  plugins: [
    react(),
    {
      name: 'isolated-usb-fixture',
      transformIndexHtml: () => [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: `Object.defineProperty(navigator, 'usb', { value: {
        getDevices: async () => [], addEventListener() {}, removeEventListener() {},
        requestDevice: async () => { throw new Error('USB físico não faz parte desta fixture.'); }
      } });`,
        },
      ],
    },
  ],
  resolve: { alias: { '@': resolve('src/renderer/src') } },
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
});
await server.listen();
server.printUrls();
