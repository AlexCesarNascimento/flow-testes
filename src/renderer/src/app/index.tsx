import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.scss';
import App from './App';
import { setAdapter, init } from '@/features/device-mirror';
import { ScrcpyWebUsbAdapter } from '@/shared/lib/device-mirror';

// Configura o adaptador real (scrcpy via WebUSB) e inicia a observação de devices
setAdapter(new ScrcpyWebUsbAdapter());
init().catch((err) => console.warn('[DeviceMirror] init falhou:', err));

const root = document.getElementById('root')!;
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
