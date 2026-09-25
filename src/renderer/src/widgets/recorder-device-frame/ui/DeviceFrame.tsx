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
    <div className="device-frame__idle">
      <svg
        className="device-frame__idle-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  const { status, errorMessage } = useDeviceStore();
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
            <div className="device-frame__overlay">
              <div className="device-frame__spinner" />
              <span className="device-frame__overlay-label">Conectando…</span>
            </div>
          )}

          {isError && (
            <div className="device-frame__overlay device-frame__overlay--error">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="device-frame__error-msg">{errorMessage}</span>
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
            >
              −
            </button>
            <span className="device-frame__zoom-label">100%</span>
            <button
              className="device-frame__zoom-btn"
              aria-label="Aumentar zoom"
            >
              +
            </button>
          </div>
          <div className="device-frame__action-row">
            {['Reiniciar', 'Screenshot', 'Voltar'].map((label) => (
              <button key={label} className="device-frame__action-btn">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
