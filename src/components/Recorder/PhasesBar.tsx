import type { RecorderPhase } from '../../store';

interface Props {
  phase: RecorderPhase;
  onPhaseChange: (p: RecorderPhase) => void;
  recording: boolean;
  recordingSeconds: number;
}

const PHASES: { key: RecorderPhase; label: string; n: number }[] = [
  { key: 'gravar', label: 'Gravar', n: 1 },
  { key: 'editar', label: 'Editar e parametrizar', n: 2 },
  { key: 'salvar', label: 'Salvar como Action', n: 3 },
];

function phaseIndex(p: RecorderPhase) {
  return PHASES.findIndex((ph) => ph.key === p);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function PhasesBar({
  phase,
  onPhaseChange,
  recording,
  recordingSeconds,
}: Props) {
  const activeIndex = phaseIndex(phase);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        height: 48,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        gap: 4,
        flexShrink: 0,
      }}
    >
      {/* Fases */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {PHASES.map((ph, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;

          return (
            <div
              key={ph.key}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {/* Separador */}
              {i > 0 && (
                <svg
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
                  style={{ flexShrink: 0 }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}

              <button
                onClick={() => onPhaseChange(ph.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isActive
                    ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)'
                    : '1px solid transparent',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {/* Número / check */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: isActive
                      ? 'var(--color-accent)'
                      : isDone
                        ? 'transparent'
                        : 'var(--color-elevated)',
                    border: isDone
                      ? '2px solid var(--color-accent)'
                      : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
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
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: isActive ? '#000' : 'var(--color-text-3)',
                        lineHeight: 1,
                      }}
                    >
                      {ph.n}
                    </span>
                  )}
                </div>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? 'var(--color-text-1)'
                      : isDone
                        ? 'var(--color-text-2)'
                        : 'var(--color-text-3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ph.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Indicador de gravação (só fase gravar) */}
      {phase === 'gravar' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginLeft: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--color-text-2)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-red)',
                flexShrink: 0,
                animation: recording ? 'pulse 1.2s infinite' : undefined,
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--color-text-1)' }}>
              Gravando
            </span>
            <span
              style={{
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--color-accent)',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {formatTime(recordingSeconds)}
            </span>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--color-border-strong)',
              background: 'var(--color-elevated)',
              color: 'var(--color-text-2)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            Pausar
          </button>

          <button
            onClick={() => onPhaseChange('editar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 12px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--color-accent)',
              color: '#000',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Finalizar
          </button>
        </div>
      )}
    </div>
  );
}
