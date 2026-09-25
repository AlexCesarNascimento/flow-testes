import type { Step, StepType } from '@/entities/step';
import type { RecorderPhase } from '@/entities/recorder';
import './steps-panel.scss';

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
      <div className="steps-panel__item-icon">
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

  if (type === 'inputText') {
    return (
      <div
        className="steps-panel__item-icon steps-panel__item-icon--colored"
        style={{ ['--icon-color' as string]: color }}
      >
        <span className="steps-panel__item-icon-text">T</span>
      </div>
    );
  }

  if (
    type === 'tap' ||
    type === 'swipe' ||
    type === 'scroll' ||
    type === 'longPress'
  ) {
    return (
      <div
        className="steps-panel__item-icon steps-panel__item-icon--colored"
        style={{ ['--icon-color' as string]: color }}
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

  if (type === 'waitForElement') {
    return (
      <div
        className="steps-panel__item-icon steps-panel__item-icon--colored"
        style={{ ['--icon-color' as string]: color }}
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
    <div className="steps-panel__item-icon">
      <span className="steps-panel__item-unknown">?</span>
    </div>
  );
}

export function StepsPanel({
  phase,
  steps,
  selectedStepId,
  onSelectStep,
}: Props) {
  const visibleSteps = phase === 'gravar' ? steps.slice(0, 1) : steps;
  const isEditing = phase === 'editar' || phase === 'salvar';

  return (
    <div className="steps-panel">
      <div className="steps-panel__header">
        <span className="steps-panel__title">
          {phase === 'gravar' ? 'Steps gravados' : 'Steps'}
        </span>
        <span className="steps-panel__count">{visibleSteps.length}</span>
        <div className="steps-panel__spacer" />
        <button className="steps-panel__header-btn">
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
        <button className="steps-panel__header-btn">
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

      {phase === 'editar' && (
        <div className="steps-panel__run-controls">
          {[
            { label: 'Este step' },
            { label: 'Até aqui' },
            { label: 'A partir daqui' },
            { label: 'Tudo' },
          ].map((btn) => (
            <button key={btn.label} className="steps-panel__run-btn">
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

      <div className="steps-panel__list">
        {visibleSteps.map((step) => {
          const isSelected = step.id === selectedStepId;
          const isChecked = step.selected;
          const typeColor = STEP_COLORS[step.type];

          return (
            <div
              key={step.id}
              onClick={() => isEditing && onSelectStep(step.id)}
              className={`steps-panel__item${isEditing ? ' steps-panel__item--clickable' : ''}${isSelected ? ' steps-panel__item--active' : ''}`}
            >
              <div
                className={`steps-panel__item-checkbox${isChecked ? ' steps-panel__item-checkbox--checked' : ''}`}
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

              <span className="steps-panel__item-num">{step.id}</span>

              <div className="steps-panel__item-status" />

              <StepIcon type={step.type} />

              <div className="steps-panel__item-body">
                <div className="steps-panel__item-type-row">
                  <span
                    className="steps-panel__item-type"
                    style={{
                      ['--type-color' as string]: typeColor,
                      color: 'var(--type-color)',
                    }}
                  >
                    {STEP_LABELS[step.type]}
                  </span>
                  {step.type === 'waitForElement' && (
                    <span className="steps-panel__item-auto-badge">AUTO</span>
                  )}
                </div>
                <div
                  className={`steps-panel__item-label${isSelected ? ' steps-panel__item-label--active' : ''}`}
                >
                  {step.label}
                </div>
              </div>

              <span className="steps-panel__item-time">{step.time}</span>
            </div>
          );
        })}
      </div>

      {phase === 'gravar' && (
        <div className="steps-panel__tip">
          Cada toque e digitação vira um step com o melhor selector disponível.
        </div>
      )}
    </div>
  );
}
