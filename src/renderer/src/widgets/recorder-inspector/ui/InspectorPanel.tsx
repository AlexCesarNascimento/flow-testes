import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stepDisplayLabel, type Step, type Selector } from '@/entities/step';
import type { RecorderPhase } from '@/entities/recorder';
import { useRecorderStore } from '@/entities/recorder';
import { useDatasetStore } from '@/entities/dataset';
import { useActionStore } from '@/entities/action';
import { useDeviceStore } from '@/entities/device';
import { screenDisplayName } from '@/shared/lib/screen-signature';
import { playStep } from '@/features/event-playback';
import './inspector-panel.scss';

interface Props {
  phase: RecorderPhase;
  selectedStep: Step | null;
  totalSteps: number;
  selectedCount: number;
}

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
  const [label, setLabel] = useState('Copiar');

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(
      () => {
        setLabel('Copiado!');
        setTimeout(() => setLabel('Copiar'), 1500);
      },
      () => {
        setLabel('Erro');
        setTimeout(() => setLabel('Copiar'), 1500);
      },
    );
  };

  return (
    <button
      onClick={handleCopy}
      title="Copiar para área de transferência"
      aria-label={`Copiar valor: ${value}`}
      className="inspector-panel__copy-btn"
    >
      {label}
    </button>
  );
}

function InspectorGravar({ step }: { step: Step | null }) {
  const recording = useRecorderStore((s) => s.recording);
  const captureStatus = useRecorderStore((s) => s.captureStatus);
  const steps = useRecorderStore((s) => s.steps);
  const screenshots = useRecorderStore((s) => s.screenshots);
  const deviceStatus = useDeviceStore((s) => s.status);
  const selectedIndex = step
    ? steps.findIndex((item) => item.id === step.id)
    : -1;
  const relevantSteps =
    selectedIndex < 0 ? steps : steps.slice(0, selectedIndex + 1);
  const screen = [...relevantSteps]
    .reverse()
    .find((item) => item.type === 'waitForPage');
  const selector =
    step?.selectors.find(
      (item) => item.recommended && item.type !== 'coordinates',
    ) ?? step?.selectors.find((item) => item.type !== 'coordinates');
  const screenName =
    (screen?.screenSignature
      ? screenDisplayName(screen.screenSignature)
      : null) ?? (screen ? stepDisplayLabel(screen) : null);
  const status = !recording
    ? 'Aguardando gravação'
    : captureStatus === 'preparing'
      ? 'Lendo hierarquia'
      : captureStatus === 'error'
        ? 'Hierarquia indisponível'
        : captureStatus === 'ready'
          ? 'Monitorando tela'
          : 'Aguardando device';

  return (
    <div className="inspector-panel__inner">
      <div className="inspector-panel__header">
        <span className="inspector-panel__title">Contexto da gravação</span>
        <span className="inspector-panel__live-badge">{status}</span>
      </div>

      <div className="inspector-panel__body">
        <div className="inspector-panel__context-card">
          <span className="inspector-panel__context-label">Device</span>
          <strong>
            {deviceStatus === 'streaming' ? 'Conectado' : 'Desconectado'}
          </strong>
          <span className="inspector-panel__context-note">{status}</span>
        </div>
        <div className="inspector-panel__context-card">
          <span className="inspector-panel__context-label">Tela do step</span>
          <strong>{screenName ?? 'Ainda não reconhecida'}</strong>
          <span className="inspector-panel__context-note">
            {screen?.screenSignature?.packageName ?? 'Aguardando assinatura'}
            {screen &&
              ` · ${screenshots[screen.id] ? 'Captura disponível' : 'Sem miniatura'}`}
          </span>
        </div>
        {step && (
          <div className="inspector-panel__context-card">
            <span className="inspector-panel__context-label">
              Step selecionado
            </span>
            <strong>{stepDisplayLabel(step)}</strong>
            <span className="inspector-panel__context-note">
              {selector
                ? `${SELECTOR_LABELS[selector.type]} · ${selector.stability === 'stable' ? 'Estável' : 'Atenção'}`
                : step.type === 'secureKeypad'
                  ? 'Pares numéricos identificados no Play'
                  : 'Sem seletor semântico'}
            </span>
          </div>
        )}
        <p className="inspector-panel__context-help">
          {step &&
          !selector &&
          !['waitForPage', 'secureKeypad'].includes(step.type)
            ? 'Este step não tem seletor semântico. Revise a captura antes de salvar o bloco.'
            : 'Abra um step na trilha para revisar seletores, delay e JSON.'}
        </p>
      </div>
    </div>
  );
}

function InspectorEditar({ step }: { step: Step | null }) {
  const removeStep = useRecorderStore((s) => s.removeStep);
  const updateStep = useRecorderStore((s) => s.updateStep);
  const datasetColumns = useDatasetStore((s) => s.columns);
  const datasetActiveRow = useDatasetStore((s) => s.rows[s.activeRowIndex]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inputTextValue, setInputTextValue] = useState('');
  const variableSelect = useRef<HTMLSelectElement>(null);

  // Detecta se o step atual já usa uma variável `{{col}}`.
  const currentVarMatch = step?.value?.match(/^\{\{\s*([a-zA-Z0-9_]+)\s*\}\}$/);
  const currentVarCol = currentVarMatch ? currentVarMatch[1] : '';

  const handleBindVariable = (colName: string) => {
    if (!step) return;
    if (!colName) {
      // Desvincular: volta o value para o placeholder da coluna
      return;
    }
    updateStep(step.id, {
      type: 'inputText',
      value: `{{${colName}}}`,
      label: `Digitar {{${colName}}}`,
    });
    const preview = datasetActiveRow?.[colName] ?? '';
    setFeedback(
      preview
        ? `Vinculado a {{${colName}}}. Massa ativa vai digitar: "${preview}".`
        : `Vinculado a {{${colName}}}. Preencha a coluna na massa ativa em Dados › Datasets.`,
    );
    setTimeout(() => setFeedback(null), 4000);
  };

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

  const handlePlay = async () => {
    setFeedback('Executando…');
    const result = await playStep(step);
    setFeedback(result);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = () => {
    if (window.confirm(`Excluir step #${step.id}?`)) {
      removeStep(step.id);
    }
  };

  const handleConvertToInput = () => {
    if (!inputTextValue.trim()) {
      setFeedback('Digite o texto que deve ser inserido.');
      setTimeout(() => setFeedback(null), 2500);
      return;
    }
    updateStep(step.id, {
      type: 'inputText',
      value: inputTextValue,
      label: `Digitar "${inputTextValue}"`,
    });
    setFeedback('Convertido para inputText.');
    setInputTextValue('');
    setTimeout(() => setFeedback(null), 2500);
  };

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

        <div
          className="inspector-panel__section"
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
        >
          <button
            type="button"
            onClick={handlePlay}
            className="inspector-panel__var-btn"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
            aria-label="Reproduzir step no dispositivo"
          >
            ▶ Play
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inspector-panel__var-btn"
            style={{
              borderColor: 'var(--color-red)',
              color: 'var(--color-red)',
            }}
            aria-label="Excluir step"
          >
            🗑 Excluir
          </button>
        </div>

        <div className="inspector-panel__section">
          <div className="inspector-panel__field-label">
            VINCULAR A VARIÁVEL DO DATASET
          </div>
          <div className="inspector-panel__input-row">
            <select
              ref={variableSelect}
              value={currentVarCol}
              onChange={(e) => handleBindVariable(e.target.value)}
              aria-label="Escolha a coluna do dataset"
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: 12,
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                color: 'var(--color-text-1)',
              }}
            >
              <option value="">
                {datasetColumns.length === 0
                  ? '(nenhuma coluna no dataset)'
                  : '— escolha uma variável —'}
              </option>
              {datasetColumns.map((c) => {
                const preview = datasetActiveRow?.[c];
                return (
                  <option key={c} value={c}>
                    {`{{${c}}}${preview ? ` · "${preview}"` : ' · (vazio)'}`}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="inspector-panel__input-hint">
            {currentVarCol
              ? `Atual: {{${currentVarCol}}}. Trocar aqui vai atualizar o step.`
              : datasetColumns.length === 0
                ? 'Vá em Dados › Datasets para criar colunas.'
                : 'Escolha uma coluna do dataset para digitar seu valor no playback.'}
          </div>
        </div>

        {step.type === 'tap' && (
          <div className="inspector-panel__section">
            <div className="inspector-panel__field-label">
              CONVERTER EM INPUTTEXT
            </div>
            <div className="inspector-panel__input-row">
              <input
                aria-label="Texto que substitui o toque no teclado"
                placeholder="Ex: alex@email.com"
                value={inputTextValue}
                onChange={(e) => setInputTextValue(e.target.value)}
                className="inspector-panel__input"
              />
              <button
                type="button"
                onClick={handleConvertToInput}
                className="inspector-panel__var-btn"
              >
                Converter
              </button>
            </div>
            <div className="inspector-panel__input-hint">
              Substitui um toque no teclado virtual por uma digitação real.
            </div>
          </div>
        )}

        {feedback && (
          <div
            className="inspector-panel__section"
            role="status"
            aria-live="polite"
            style={{
              padding: '8px 10px',
              background: 'var(--color-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--color-text-2)',
            }}
          >
            {feedback}
          </div>
        )}

        {hasValue && (
          <div className="inspector-panel__section">
            <div className="inspector-panel__field-label">VALOR DIGITADO</div>
            <div className="inspector-panel__input-row">
              <input
                id="inspector-step-value"
                aria-label="Valor digitado no step"
                value={step.value ?? ''}
                onChange={(event) =>
                  updateStep(step.id, {
                    type: 'inputText',
                    value: event.target.value,
                    label: `Digitar ${event.target.value}`,
                  })
                }
                className="inspector-panel__input"
              />
              <button
                type="button"
                className="inspector-panel__var-btn"
                aria-label="Transformar valor em variável"
                onClick={() => variableSelect.current?.focus()}
              >
                {'{ } Var'}
              </button>
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
            {step.selectors
              .filter((s) => s.type !== 'coordinates')
              .map((s, i) => (
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
  const navigate = useNavigate();
  const steps = useRecorderStore((s) => s.steps);
  const addAction = useActionStore((s) => s.addAction);
  const busy = useRecorderStore((s) => s.recording || s.playbackRunning);
  const [name, setName] = useState('Fazer login');
  const [folder, setFolder] = useState('Autenticação');
  const [saved, setSaved] = useState<string | null>(null);

  const stepsToSave =
    steps.filter((s) => s.selected).length > 0
      ? steps.filter((s) => s.selected)
      : steps;

  // Extrai colunas usadas como `{{coluna}}` para mostrar como parâmetros.
  const paramCols = Array.from(
    new Set(
      stepsToSave
        .flatMap((s) =>
          s.value
            ? Array.from(s.value.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g))
            : [],
        )
        .map((m) => m[1]),
    ),
  );

  const handleSave = () => {
    if (busy || stepsToSave.some((step) => step.pending)) return;
    if (!name.trim()) return;
    if (stepsToSave.length === 0) {
      setSaved('Sem steps para salvar. Grave algo antes.');
      setTimeout(() => setSaved(null), 3000);
      return;
    }
    try {
      const action = addAction({
        name: name.trim(),
        folder: folder.trim() || 'Sem pasta',
        steps: stepsToSave,
        paramColumns: paramCols,
      });
      navigate(`/flows?bloco=${encodeURIComponent(action.id)}`);
    } catch {
      setSaved(
        'Não foi possível salvar o bloco neste computador. A gravação foi preservada.',
      );
    }
  };

  return (
    <div className="inspector-panel__inner">
      <div className="inspector-panel__save-header">
        <span className="inspector-panel__title">Salvar como Action</span>
      </div>

      <div className="inspector-panel__save-body">
        <div className="inspector-panel__save-info">
          <strong className="inspector-panel__save-strong">
            {stepsToSave.length} de {totalSteps} steps
          </strong>{' '}
          {selectedCount > 0 ? '(dos marcados) ' : ''}
          viram uma Action reutilizável.
        </div>

        <div>
          <label
            htmlFor="inspector-action-name"
            className="inspector-panel__form-label"
          >
            Nome da Action
          </label>
          <input
            id="inspector-action-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="inspector-panel__input-wide"
          />
        </div>

        <div>
          <label
            htmlFor="inspector-action-folder"
            className="inspector-panel__form-label"
          >
            Pasta
          </label>
          <input
            id="inspector-action-folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="inspector-panel__input-wide"
          />
        </div>

        <div>
          <div className="inspector-panel__field-label">
            PARÂMETROS DETECTADOS
          </div>
          <div className="inspector-panel__params-box">
            {paramCols.length > 0 ? (
              <>
                Esta Action usa <strong>{paramCols.length}</strong> variáve
                {paramCols.length === 1 ? 'l' : 'is'} do dataset:{' '}
                {paramCols.map((c, i) => (
                  <span key={c}>
                    <code>{`{{${c}}}`}</code>
                    {i < paramCols.length - 1 ? ', ' : ''}
                  </span>
                ))}
                . No Flow, você conecta cada uma a uma coluna da massa.
              </>
            ) : (
              <>
                Nenhum step virou variável. Use "Digitar variável do dataset" no{' '}
                <strong>+ Add</strong> pra parametrizar.
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={
            busy ||
            stepsToSave.some((step) => step.pending) ||
            !name.trim() ||
            stepsToSave.length === 0
          }
          className="inspector-panel__save-btn"
        >
          Salvar Action
        </button>

        {saved && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: 10,
              padding: '10px 12px',
              background: 'rgba(0, 200, 100, 0.12)',
              border: '1px solid rgba(0, 200, 100, 0.4)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--color-text-1)',
            }}
          >
            {saved}
          </div>
        )}
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
