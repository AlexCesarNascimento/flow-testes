import type { RecorderPhase } from '@/entities/recorder';
import './phases-bar.scss';

interface Props {
  phase: RecorderPhase;
  onPhaseChange: (p: RecorderPhase) => void;
  recording: boolean;
  recordingSeconds: number;
  onStartRecording: () => void;
  onFinishRecording: () => void;
}

// Gravar+Editar são um mesmo workspace agora. Só há dois passos visuais:
// (1) montar o fluxo (gravando + editando) e (2) salvar como Action.
const PHASES: { key: RecorderPhase; label: string; n: number }[] = [
  { key: 'gravar', label: 'Fluxo', n: 1 },
  { key: 'salvar', label: 'Salvar como Action', n: 2 },
];

function phaseIndex(p: RecorderPhase) {
  // gravar e editar mapeiam para o mesmo tab (índice 0)
  if (p === 'gravar' || p === 'editar') return 0;
  return PHASES.findIndex((ph) => ph.key === p);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PhasesBar({
  phase,
  onPhaseChange,
  recording,
  recordingSeconds,
  onStartRecording,
  onFinishRecording,
}: Props) {
  const activeIndex = phaseIndex(phase);

  return (
    <div className="phases-bar">
      <div className="phases-bar__phases">
        {PHASES.map((ph, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;

          return (
            <div key={ph.key} className="phases-bar__step">
              {i > 0 && (
                <svg
                  className="phases-bar__step-sep"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={
                    i <= activeIndex
                      ? 'var(--color-text-2)'
                      : 'var(--color-text-3)'
                  }
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}

              <button
                onClick={() => onPhaseChange(ph.key)}
                className={`phases-bar__step-btn${isActive ? ' phases-bar__step-btn--active' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Fase ${ph.n}: ${ph.label}${isDone ? ' (concluída)' : isActive ? ' (atual)' : ''}`}
              >
                <div
                  className={`phases-bar__badge${isActive ? ' phases-bar__badge--active' : isDone ? ' phases-bar__badge--done' : ''}`}
                >
                  {isDone ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span
                      className={`phases-bar__badge-number${isActive ? ' phases-bar__badge-number--active' : ''}`}
                    >
                      {ph.n}
                    </span>
                  )}
                </div>

                <span
                  className={`phases-bar__step-label${isActive ? ' phases-bar__step-label--active' : isDone ? ' phases-bar__step-label--done' : ''}`}
                >
                  {ph.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {(phase === 'gravar' || phase === 'editar') && (
        <div className="phases-bar__controls">
          {recording ? (
            <>
              <div className="phases-bar__recording">
                <span className="phases-bar__rec-dot phases-bar__rec-dot--pulsing" />
                <span className="phases-bar__rec-label">Gravando</span>
                <span className="phases-bar__rec-time">
                  {formatTime(recordingSeconds)}
                </span>
              </div>

              <button
                className="phases-bar__btn"
                disabled
                aria-label="Pausar gravação"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Pausar
              </button>

              <button
                onClick={onFinishRecording}
                className="phases-bar__btn phases-bar__btn--primary"
                aria-label="Finalizar gravação"
              >
                Finalizar
              </button>
            </>
          ) : (
            <button
              onClick={onStartRecording}
              className="phases-bar__btn phases-bar__btn--primary"
              aria-label="Iniciar gravação"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="8" />
              </svg>
              Iniciar gravação
            </button>
          )}
        </div>
      )}
    </div>
  );
}
