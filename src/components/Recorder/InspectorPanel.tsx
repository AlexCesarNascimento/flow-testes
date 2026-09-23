import type { Step, Selector, RecorderPhase } from '../../store';

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
      style={{
        padding: '2px 6px',
        borderRadius: 4,
        border: '1px solid var(--color-border)',
        background: 'var(--color-elevated)',
        color: 'var(--color-text-3)',
        cursor: 'pointer',
        fontSize: 10,
        flexShrink: 0,
      }}
    >
      Copiar
    </button>
  );
}

/* ── FASE GRAVAR ─────────────────────────────────────────────────────── */
function InspectorGravar({ step }: { step: Step | null }) {
  const sel = step?.selectors ?? [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        height: '100%',
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
          Inspector
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'var(--color-accent)',
            background: 'var(--color-accent-bg)',
            border:
              '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
            borderRadius: 4,
            padding: '1px 6px',
          }}
        >
          INSPETOR LIGADO
        </span>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {/* Elemento selecionado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              background: 'var(--color-accent)',
              color: '#000',
              borderRadius: 6,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            Application·app
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
            do step selecionado
          </span>
        </div>

        {/* Tabela de propriedades */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 14,
          }}
        >
          {[
            { label: 'Classe', value: 'android.widget.Application' },
            { label: 'Texto', value: 'App Exemplo' },
            { label: 'Accessibility ID', value: '—' },
            { label: 'Resource ID', value: 'com.exemplo.app' },
            { label: 'Bounds', value: '[0,0][1080,2400]' },
          ].map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                padding: '6px 12px',
                borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-3)',
                  width: 100,
                  flexShrink: 0,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-1)',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Selectors */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--color-text-3)',
            marginBottom: 8,
          }}
        >
          SELECTORS · DO MAIS ESTÁVEL AO MAIS FRÁGIL
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sel.map((s, i) => (
            <div
              key={i}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text-2)',
                  }}
                >
                  {SELECTOR_LABELS[s.type]}
                </span>
                {s.recommended && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      background: 'var(--color-accent-bg)',
                      border:
                        '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                      borderRadius: 4,
                      padding: '0 5px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    RECOMENDADO
                  </span>
                )}
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: STABILITY_COLORS[s.stability],
                    background: `color-mix(in srgb, ${STABILITY_COLORS[s.stability]} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${STABILITY_COLORS[s.stability]} 25%, transparent)`,
                    borderRadius: 4,
                    padding: '0 5px',
                    letterSpacing: '0.04em',
                  }}
                >
                  {STABILITY_LABELS[s.stability]}
                </span>
                <CopyButton value={s.value} />
              </div>
              <code
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-2)',
                  fontFamily: 'monospace',
                  display: 'block',
                  wordBreak: 'break-all',
                }}
              >
                {s.value}
              </code>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div
          style={{
            marginTop: 14,
            background:
              'color-mix(in srgb, var(--color-purple) 8%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--color-purple) 20%, transparent)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 11,
            color: 'var(--color-text-2)',
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: 'var(--color-purple)', marginRight: 4 }}>
            ✕
          </span>
          <strong>Smart wait automático.</strong> Depois de um tap que navega, o
          Recorder adiciona um <em>Wait for element</em> — sem seletor fixo,
          para você ajustar no passo Editar.
        </div>
      </div>
    </div>
  );
}

/* ── FASE EDITAR ─────────────────────────────────────────────────────── */
function InspectorEditar({ step }: { step: Step | null }) {
  if (!step) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--color-text-3)',
          fontSize: 12,
          padding: 24,
          textAlign: 'center',
        }}
      >
        Clique em um step para editar seus atributos.
      </div>
    );
  }

  const typeColor = STEP_TYPE_COLORS[step.type] ?? 'var(--color-text-2)';
  const typeLabel = STEP_TYPE_LABELS[step.type] ?? step.type.toUpperCase();
  const hasValue = step.type === 'inputText' || step.type === 'tap';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid var(--color-border)',
          gap: 6,
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
          Editar step
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--color-accent)',
          }}
        >
          {step.id}
        </span>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {/* Pill tipo */}
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: typeColor,
              background: `color-mix(in srgb, ${typeColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${typeColor} 25%, transparent)`,
              borderRadius: 6,
              padding: '3px 10px',
              letterSpacing: '0.05em',
            }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Valor digitado */}
        {hasValue && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--color-text-3)',
                marginBottom: 8,
              }}
            >
              VALOR DIGITADO
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                defaultValue={step.value ?? step.label}
                style={{
                  flex: 1,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  color: 'var(--color-text-1)',
                  fontSize: 12,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-elevated)',
                  color: 'var(--color-text-3)',
                  cursor: 'pointer',
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {'{ } Var'}
              </button>
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--color-text-3)',
                marginTop: 4,
              }}
            >
              Transformar em variável
            </div>
          </div>
        )}

        {/* Selectors */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-3)',
              marginBottom: 8,
            }}
          >
            SELECTOR · ORDENADOS POR ESTABILIDADE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {step.selectors.map((s, i) => (
              <label
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  background:
                    i === 0
                      ? 'color-mix(in srgb, var(--color-accent) 6%, transparent)'
                      : 'var(--color-surface)',
                  border:
                    i === 0
                      ? '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)'
                      : '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  cursor: 'pointer',
                }}
              >
                {/* Radio */}
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border:
                      i === 0
                        ? '4px solid var(--color-accent)'
                        : '1px solid var(--color-border-strong)',
                    marginTop: 1,
                    flexShrink: 0,
                    background: 'transparent',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-text-2)',
                      }}
                    >
                      {SELECTOR_LABELS[s.type]}
                    </span>
                    {s.recommended && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: 'var(--color-accent)',
                          background: 'var(--color-accent-bg)',
                          border:
                            '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                          borderRadius: 4,
                          padding: '0 4px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        RECOMENDADO
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <CopyButton value={s.value} />
                  </div>
                  <code
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-3)',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {s.value}
                  </code>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Opções */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-3)',
              marginBottom: 8,
            }}
          >
            OPÇÕES
          </div>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 12,
                color: 'var(--color-text-1)',
                marginBottom: 4,
              }}
            >
              Smart wait
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-3)',
                lineHeight: 1.5,
              }}
            >
              Espera o elemento existir, ficar visível e estável (até 10 s
              padrão).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── FASE SALVAR ─────────────────────────────────────────────────────── */
function InspectorSalvar({
  totalSteps,
  selectedCount,
}: {
  totalSteps: number;
  selectedCount: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--color-border)',
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
          Salvar como Action
        </span>
      </div>

      {/* Conteúdo */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Info */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-2)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--color-text-1)' }}>
            {selectedCount} de {totalSteps} steps
          </strong>{' '}
          viram uma Action reutilizável. Para incluir mais, volte para{' '}
          <span style={{ color: 'var(--color-accent)', cursor: 'pointer' }}>
            Editar
          </span>
          .
        </div>

        {/* Nome */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-2)',
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            Nome da Action
          </div>
          <input
            defaultValue="Fazer login"
            style={{
              width: '100%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 6,
              padding: '7px 10px',
              color: 'var(--color-text-1)',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Pasta */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-2)',
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            Pasta
          </div>
          <input
            defaultValue="Autenticação"
            style={{
              width: '100%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 6,
              padding: '7px 10px',
              color: 'var(--color-text-1)',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Parâmetros */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-3)',
              marginBottom: 8,
            }}
          >
            PARÂMETROS DETECTADOS
          </div>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 11,
              color: 'var(--color-text-3)',
              lineHeight: 1.6,
            }}
          >
            Nenhum step virou variável. Em{' '}
            <span style={{ color: 'var(--color-accent)' }}>Editar</span>, use
            "Transformar em variável" num Input text para reaproveitar esta
            Action com dados diferentes.
          </div>
        </div>

        {/* Botão salvar */}
        <button
          style={{
            background: 'var(--color-accent)',
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            color: '#000',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            width: '100%',
            marginTop: 'auto',
          }}
        >
          Salvar Action
        </button>
      </div>
    </div>
  );
}

/* ── Componente principal ────────────────────────────────────────────── */
export default function InspectorPanel({
  phase,
  selectedStep,
  totalSteps,
  selectedCount,
}: Props) {
  return (
    <div
      style={{
        height: '100%',
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
      }}
    >
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
