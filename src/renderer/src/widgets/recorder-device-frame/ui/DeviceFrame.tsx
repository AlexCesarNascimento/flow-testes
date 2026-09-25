import { useEffect, useRef } from 'react';
import type { RecorderPhase } from '@/entities/recorder';
import { useDeviceStore } from '@/entities/device';
import { setCanvas, init, dispose } from '@/features/device-mirror';
import './device-frame.scss';

interface Props {
  phase: RecorderPhase;
}

function IdleState() {
  return (
    <div
      className="device-frame__idle"
      role="status"
      aria-label="Aguardando dispositivo"
    >
      <svg
        className="device-frame__idle-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
        <path d="M9 6h6" />
      </svg>
      <span className="device-frame__idle-title">Nenhum dispositivo</span>
      <span className="device-frame__idle-hint">
        Conecte um Android via USB com depuração ativa
      </span>
    </div>
  );
}

export function DeviceFrame({ phase }: Props) {
  const isLive = phase === 'gravar';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const status = useDeviceStore((s) => s.status);
  const errorMessage = useDeviceStore((s) => s.errorMessage);
  const isStreaming = status === 'streaming';
  const isConnecting = status === 'connecting';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  // Registra canvas e inicia observação de devices após montagem
  useEffect(() => {
    setCanvas(canvasRef.current);
    void init();
    return () => {
      setCanvas(null);
      void dispose();
    };
  }, []);

  return (
    <div className="device-frame">
      <div className="device-frame__shell">
        <div className="device-frame__notch" />

        <div className="device-frame__screen">
          <canvas
            ref={canvasRef}
            className={`device-frame__canvas${isStreaming ? '' : ' device-frame__canvas--hidden'}`}
          />

          {isIdle && <IdleState />}

          {isConnecting && (
            <div
              className="device-frame__overlay"
              role="status"
              aria-live="polite"
              aria-busy="true"
              aria-label="Conectando ao dispositivo"
            >
              <div className="device-frame__spinner" aria-hidden="true" />
              <span className="device-frame__overlay-label">Conectando…</span>
            </div>
          )}

          {isError && (
            <div
              className="device-frame__overlay device-frame__overlay--error"
              role="alert"
              aria-live="assertive"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="device-frame__error-msg">
                {errorMessage ?? 'Falha ao conectar ao dispositivo.'}
              </span>
              <span className="device-frame__error-hint">
                Verifique a depuração USB e reconecte o cabo.
              </span>
            </div>
          )}
        </div>
      </div>

      {isLive && (
        <div className="device-frame__controls">
          <div className="device-frame__zoom-row">
            <button
              className="device-frame__zoom-btn"
              aria-label="Reduzir zoom"
              disabled
            >
              −
            </button>
            <span className="device-frame__zoom-label">100%</span>
            <button
              className="device-frame__zoom-btn"
              aria-label="Aumentar zoom"
              disabled
            >
              +
            </button>
          </div>
          <div className="device-frame__action-row">
            {['Reiniciar', 'Screenshot', 'Voltar'].map((label) => (
              <button key={label} className="device-frame__action-btn" disabled>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
