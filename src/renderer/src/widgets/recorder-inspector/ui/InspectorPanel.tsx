import type { Step, Selector } from '@/entities/step';
import type { RecorderPhase } from '@/entities/recorder';
import './inspector-panel.scss';

interface Props {
  phase: RecorderPhase;
  selectedStep: Step | null;
  totalSteps: number;
  selectedCount: number;
}

const STABILITY_LABELS: Record<Selector['stability'], string> = {
  stable: 'ESTÁVEL',
  medium: 'MÉDIO',
  fragile: 'FRÁGIL',
};

const STABILITY_COLORS: Record<Selector['stability'], string> = {
  stable: 'var(--color-accent)',
  medium: 'var(--color-amber)',
  fragile: 'var(--color-red)',
};

const SELECTOR_LABELS: Record<Selector['type'], string> = {
  resourceId: 'Resource ID',
  accessibilityId: 'Accessibility ID',
  text: 'Text',
  xpath: 'XPath',
  coordinates: 'Coordenadas',
  androidUi: 'Android UI Selector',
};

const STEP_TYPE_LABELS: Record<string, string> = {
  launchApp: 'LAUNCH APP',
  tap: 'TAP',
  inputText: 'INPUT TEXT',
  waitForElement: 'WAIT FOR ELEMENT',
  assert: 'ASSERT',
  wait: 'WAIT',
};

const STEP_TYPE_COLORS: Record<string, string> = {
  launchApp: 'var(--color-text-3)',
  tap: 'var(--color-blue)',
  inputText: 'var(--color-blue)',
  waitForElement: 'var(--color-purple)',
  assert: 'var(--color-amber)',
  wait: 'var(--color-text-3)',
};

function CopyButton({ value }: { value: string }) {
  const handleCopy = () => navigator.clipboard.writeText(value).catch(() => {});
  return (
    <button
      onClick={handleCopy}
      title="Copiar"
      className="inspector-panel__copy-btn"
    >
      Copiar
    </button>
  );
}

function InspectorGravar({ step }: { step: Step | null }) {
  const sel = step?.selectors ?? [];

  return (
    <div className="inspector-panel__inner">
      <div className="inspector-panel__header">
        <span className="inspector-panel__title">Inspector</span>
        <span className="inspector-panel__live-badge">INSPETOR LIGADO</span>
      </div>

      <div className="inspector-panel__body">
        <div className="inspector-panel__element-tag">
          <span className="inspector-panel__tag-pill">Application·app</span>
          <span className="inspector-panel__tag-label">
            do step selecionado
          </span>
        </div>

        <div className="inspector-panel__props-table">
          {[
            { label: 'Classe', value: 'android.widget.Application' },
            { label: 'Texto', value: 'App Exemplo' },
            { label: 'Accessibility ID', value: '—' },
            { label: 'Resource ID', value: 'com.exemplo.app' },
            { label: 'Bounds', value: '[0,0][1080,2400]' },
          ].map((row) => (
            <div key={row.label} className="inspector-panel__props-row">
              <span className="inspector-panel__props-key">{row.label}</span>
              <span className="inspector-panel__props-value">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="inspector-panel__section-title">
          SELECTORS · DO MAIS ESTÁVEL AO MAIS FRÁGIL
        </div>

        <div className="inspector-panel__selector-list">
          {sel.map((s, i) => (
            <div
              key={i}
              className={`inspector-panel__selector inspector-panel__selector--${s.stability}`}
            >
              <div className="inspector-panel__selector-row">
                <span className="inspector-panel__selector-name">
                  {SELECTOR_LABELS[s.type]}
                </span>
                {s.recommended && (
                  <span className="inspector-panel__recommended-badge">
                    RECOMENDADO
                  </span>
                )}
                <div className="inspector-panel__selector-spacer" />
                <span
                  className="inspector-panel__stability-badge"
                  style={{
                    ['--stab-color' as string]: STABILITY_COLORS[s.stability],
                  }}
                >
                  {STABILITY_LABELS[s.stability]}
                </span>
                <CopyButton value={s.value} />
              </div>
              <code className="inspector-panel__selector-value">{s.value}</code>
            </div>
          ))}
        </div>

        <div className="inspector-panel__info-box">
          <span className="inspector-panel__info-icon">✕</span>
          <strong>Smart wait automático.</strong> Depois de um tap que navega, o
          Recorder adiciona um <em>Wait for element</em> — sem seletor fixo,
          para você ajustar no passo Editar.
        </div>
      </div>
    </div>
  );
}

function InspectorEditar({ step }: { step: Step | null }) {
  if (!step) {
    return (
      <div className="inspector-panel__empty">
        Clique em um step para editar seus atributos.
      </div>
    );
  }

  const typeColor = STEP_TYPE_COLORS[step.type] ?? 'var(--color-text-2)';
  const typeLabel = STEP_TYPE_LABELS[step.type] ?? step.type.toUpperCase();
  const hasValue = step.type === 'inputText' || step.type === 'tap';

  return (
    <div className="inspector-panel__inner">
      <div className="inspector-panel__header">
        <span className="inspector-panel__title">Editar step</span>
        <span className="inspector-panel__step-id">{step.id}</span>
      </div>

      <div className="inspector-panel__body">
        <div className="inspector-panel__section">
          <span
            className="inspector-panel__type-pill-inner"
            style={{ ['--type-color' as string]: typeColor }}
          >
            {typeLabel}
          </span>
        </div>

        {hasValue && (
          <div className="inspector-panel__section">
            <div className="inspector-panel__field-label">VALOR DIGITADO</div>
            <div className="inspector-panel__input-row">
              <input
                defaultValue={step.value ?? step.label}
                className="inspector-panel__input"
              />
              <button className="inspector-panel__var-btn">{'{ } Var'}</button>
            </div>
            <div className="inspector-panel__input-hint">
              Transformar em variável
            </div>
          </div>
        )}

        <div className="inspector-panel__section">
          <div className="inspector-panel__field-label">
            SELECTOR · ORDENADOS POR ESTABILIDADE
          </div>
          <div className="inspector-panel__selector-list">
            {step.selectors.map((s, i) => (
              <label
                key={i}
                className={`inspector-panel__selector-label${i === 0 ? ' inspector-panel__selector-label--recommended' : ' inspector-panel__selector-label--default'}`}
              >
                <div
                  className={`inspector-panel__radio${i === 0 ? ' inspector-panel__radio--selected' : ' inspector-panel__radio--unselected'}`}
                />
                <div className="inspector-panel__selector-label-body">
                  <div className="inspector-panel__selector-label-row">
                    <span className="inspector-panel__selector-name">
                      {SELECTOR_LABELS[s.type]}
                    </span>
                    {s.recommended && (
                      <span className="inspector-panel__recommended-badge">
                        RECOMENDADO
                      </span>
                    )}
                    <div className="inspector-panel__selector-spacer" />
                    <CopyButton value={s.value} />
                  </div>
                  <code className="inspector-panel__selector-label-value">
                    {s.value}
                  </code>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="inspector-panel__section">
          <div className="inspector-panel__field-label">OPÇÕES</div>
          <div className="inspector-panel__options-box">
            <div className="inspector-panel__options-title">Smart wait</div>
            <div className="inspector-panel__options-desc">
              Espera o elemento existir, ficar visível e estável (até 10 s
              padrão).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InspectorSalvar({
  totalSteps,
  selectedCount,
}: {
  totalSteps: number;
  selectedCount: number;
}) {
  return (
    <div className="inspector-panel__inner">
      <div className="inspector-panel__save-header">
        <span className="inspector-panel__title">Salvar como Action</span>
      </div>

      <div className="inspector-panel__save-body">
        <div className="inspector-panel__save-info">
          <strong className="inspector-panel__save-strong">
            {selectedCount} de {totalSteps} steps
          </strong>{' '}
          viram uma Action reutilizável. Para incluir mais, volte para{' '}
          <span className="inspector-panel__save-link">Editar</span>.
        </div>

        <div>
          <div className="inspector-panel__form-label">Nome da Action</div>
          <input
            defaultValue="Fazer login"
            className="inspector-panel__input-wide"
          />
        </div>

        <div>
          <div className="inspector-panel__form-label">Pasta</div>
          <input
            defaultValue="Autenticação"
            className="inspector-panel__input-wide"
          />
        </div>

        <div>
          <div className="inspector-panel__field-label">
            PARÂMETROS DETECTADOS
          </div>
          <div className="inspector-panel__params-box">
            Nenhum step virou variável. Em{' '}
            <span className="inspector-panel__save-link">Editar</span>, use
            "Transformar em variável" num Input text para reaproveitar esta
            Action com dados diferentes.
          </div>
        </div>

        <button className="inspector-panel__save-btn">Salvar Action</button>
      </div>
    </div>
  );
}

export function InspectorPanel({
  phase,
  selectedStep,
  totalSteps,
  selectedCount,
}: Props) {
  return (
    <div className="inspector-panel">
      {phase === 'gravar' && <InspectorGravar step={selectedStep} />}
      {phase === 'editar' && <InspectorEditar step={selectedStep} />}
      {phase === 'salvar' && (
        <InspectorSalvar
          totalSteps={totalSteps}
          selectedCount={selectedCount}
        />
      )}
    </div>
  );
}
