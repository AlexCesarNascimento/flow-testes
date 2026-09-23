import type { Step, StepType, RecorderPhase } from '../../store';

interface Props {
  phase: RecorderPhase;
  steps: Step[];
  selectedStepId: number | null;
  onSelectStep: (id: number) => void;
}

const STEP_COLORS: Record<StepType, string> = {
  launchApp: 'var(--color-text-3)',
  tap: 'var(--color-blue)',
  inputText: 'var(--color-blue)',
  waitForElement: 'var(--color-purple)',
  assert: 'var(--color-amber)',
  wait: 'var(--color-text-3)',
  swipe: 'var(--color-blue)',
  scroll: 'var(--color-blue)',
  keyEvent: 'var(--color-text-3)',
  longPress: 'var(--color-blue)',
};

const STEP_LABELS: Record<StepType, string> = {
  launchApp: 'LAUNCH APP',
  tap: 'TAP',
  inputText: 'INPUT TEXT',
  waitForElement: 'WAIT FOR ELEMENT',
  assert: 'ASSERT',
  wait: 'WAIT',
  swipe: 'SWIPE',
  scroll: 'SCROLL',
  keyEvent: 'KEY EVENT',
  longPress: 'LONG PRESS',
};

function StepIcon({ type }: { type: StepType }) {
  const color = STEP_COLORS[type];
  const size = 14;

  if (type === 'launchApp') {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'var(--color-elevated)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      </div>
    );
  }

  if (type === 'tap') {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
        >
          <path d="M9 9l6 0M9 9l0 6M9 9l8 8" />
        </svg>
      </div>
    );
  }

  if (type === 'inputText') {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          color: color,
          fontFamily: 'serif',
        }}
      >
        T
      </div>
    );
  }

  if (type === 'waitForElement') {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        background: 'var(--color-elevated)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 10,
        color: 'var(--color-text-3)',
      }}
    >
      ?
    </div>
  );
}

export default function StepsPanel({
  phase,
  steps,
  selectedStepId,
  onSelectStep,
}: Props) {
  const visibleSteps = phase === 'gravar' ? steps.slice(0, 1) : steps;
  const isEditing = phase === 'editar' || phase === 'salvar';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid var(--color-border)',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--color-text-1)',
          }}
        >
          {phase === 'gravar' ? 'Steps gravados' : 'Steps'}
        </span>
        <span
          style={{
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '1px 7px',
            fontSize: 11,
            color: 'var(--color-text-2)',
            fontWeight: 600,
          }}
        >
          {visibleSteps.length}
        </span>
        <div style={{ flex: 1 }} />
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'var(--color-elevated)',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
          >
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Assert
        </button>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'var(--color-elevated)',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-purple)"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Wait
        </button>
      </div>

      {/* Controles de execução (só fase editar) */}
      {phase === 'editar' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 14px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          {[
            { label: 'Este step', title: '▶ Este step' },
            { label: 'Até aqui', title: '▶ Até aqui' },
            { label: 'A partir daqui', title: '▶ A partir daqui' },
            { label: 'Tudo', title: '▶ Tudo' },
          ].map((btn) => (
            <button
              key={btn.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-elevated)',
                color: 'var(--color-text-2)',
                cursor: 'pointer',
                fontSize: 11,
                whiteSpace: 'nowrap',
              }}
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="var(--color-accent)"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de steps */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {visibleSteps.map((step) => {
          const isSelected = step.id === selectedStepId;
          const isChecked = step.selected;
          const typeColor = STEP_COLORS[step.type];

          return (
            <div
              key={step.id}
              onClick={() => isEditing && onSelectStep(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                cursor: isEditing ? 'pointer' : 'default',
                background: isSelected
                  ? 'color-mix(in srgb, var(--color-blue) 8%, transparent)'
                  : 'transparent',
                borderLeft: isSelected
                  ? '2px solid var(--color-blue)'
                  : '2px solid transparent',
                transition: 'background 0.1s',
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  border: isChecked
                    ? 'none'
                    : '1px solid var(--color-border-strong)',
                  background: isChecked ? 'var(--color-blue)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isChecked && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              {/* Número */}
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-3)',
                  width: 14,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {step.id}
              </span>

              {/* Círculo status */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: '1px solid var(--color-border-strong)',
                  flexShrink: 0,
                }}
              />

              {/* Ícone */}
              <StepIcon type={step.type} />

              {/* Descrição */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: typeColor,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {STEP_LABELS[step.type]}
                  </span>
                  {step.type === 'waitForElement' && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--color-purple)',
                        background:
                          'color-mix(in srgb, var(--color-purple) 15%, transparent)',
                        border:
                          '1px solid color-mix(in srgb, var(--color-purple) 30%, transparent)',
                        borderRadius: 4,
                        padding: '0 4px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      AUTO
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: isSelected
                      ? 'var(--color-text-1)'
                      : 'var(--color-text-2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </div>
              </div>

              {/* Timestamp */}
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-3)',
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {step.time}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tip (só fase gravar) */}
      {phase === 'gravar' && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--color-border)',
            fontSize: 11,
            color: 'var(--color-text-3)',
            flexShrink: 0,
          }}
        >
          💡 Cada toque e digitação vira um step com o melhor selector
          disponível.
        </div>
      )}
    </div>
  );
}
