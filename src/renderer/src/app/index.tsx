import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.scss';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';
import { setAdapter, ScrcpyWebUsbAdapter } from '@/features/device-mirror';

// Injeta o adaptador concreto — init() é chamado pelo DeviceFrame após o canvas montar
setAdapter(new ScrcpyWebUsbAdapter());

const root = document.getElementById('root')!;
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
