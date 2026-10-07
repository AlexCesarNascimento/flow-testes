import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock3,
  GripVertical,
  Keyboard,
  LockKeyhole,
  MousePointerClick,
  MoveHorizontal,
  MoveVertical,
  ScanSearch,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { StepDetails } from './StepDetails';
import { RecordingCode } from './RecordingCode';
import { SnapshotPreview } from './SnapshotPreview';
import { SaveBlockDialog } from '@/features/save-block';
import { stepDisplayLabel, type Step, type StepType } from '@/entities/step';
import type { RecorderPhase } from '@/entities/recorder';
import { useRecorderStore } from '@/entities/recorder';
import { useDeviceStore } from '@/entities/device';
import { useDatasetStore } from '@/entities/dataset';
import { screenDisplayName } from '@/shared/lib/screen-signature';
import {
  runSteps,
  stopRun,
  type StepProgress,
} from '@/features/event-playback';
import {
  buildRecordingExport,
  downloadRecordingJson,
  parseRecordingImport,
  pickJsonFile,
} from '@/features/flow-export';
import './steps-panel.scss';

interface Props {
  phase: RecorderPhase;
  steps: Step[];
  selectedStepId: number | null;
  onSelectStep: (id: number) => void;
}

const STEP_LABELS: Record<StepType, string> = {
  launchApp: 'Abrir app',
  tap: 'Toque',
  inputText: 'Digitar',
  secureKeypad: 'Senha dinâmica',
  waitForElement: 'Aguardar elemento',
  waitForPage: 'Reconhecer tela',
  assert: 'ASSERT',
  wait: 'WAIT',
  swipe: 'SWIPE',
  scroll: 'SCROLL',
  keyEvent: 'KEY EVENT',
  longPress: 'Pressionar',
};

const STEP_ICONS: Record<StepType, LucideIcon> = {
  launchApp: Smartphone,
  tap: MousePointerClick,
  inputText: Keyboard,
  secureKeypad: LockKeyhole,
  waitForElement: ScanSearch,
  waitForPage: ScanSearch,
  assert: ScanSearch,
  wait: Clock3,
  swipe: MoveHorizontal,
  scroll: MoveVertical,
  keyEvent: Keyboard,
  longPress: MousePointerClick,
};

function keypadTapEnd(steps: Step[], start: number): number {
  let end = start + 1;
  while (end < steps.length) {
    const candidate = steps[end];
    if (
      candidate.type !== 'tap' ||
      candidate.selectors.some(
        (selector) =>
          selector.type !== 'coordinates' &&
          !(
            selector.type === 'resourceId' &&
            /:id\/btn[1-5]$/.test(selector.value)
          ) &&
          !(
            selector.type === 'text' &&
            /^\s*\d\s*(?:ou|or)\s*\d\s*$/i.test(selector.value)
          ),
      )
    )
      break;
    end++;
  }
  return end;
}

export function StepsPanel({
  phase,
  steps,
  selectedStepId,
  onSelectStep,
}: Props) {
  const scenes: {
    screen: Step | null;
    entries: { step: Step; index: number }[];
  }[] = [];
  steps.forEach((step, index) => {
    if (!scenes.length || step.type === 'waitForPage')
      scenes.push({
        screen: step.type === 'waitForPage' ? step : null,
        entries: [],
      });
    scenes[scenes.length - 1].entries.push({ step, index });
  });
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [showCode, setShowCode] = useState(false);
  const [codeScope, setCodeScope] = useState<'flow' | 'step'>('flow');
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [saveSteps, setSaveSteps] = useState<Step[] | null>(null);
  const screenshots = useRecorderStore((s) => s.screenshots);
  const toggleDetails = (id: number) => {
    onSelectStep(id);
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const captureStatus = useRecorderStore((s) => s.captureStatus);
  const recording = useRecorderStore((s) => s.recording);
  const playbackRunning = useRecorderStore((s) => s.playbackRunning);
  // Habilita edição em gravar+editar (unificados) e salvar. Assim o usuário
  // pode pausar a gravação e editar/reordenar/executar sem trocar de fase.
  const isEditing = true;
  const [runningStepId, setRunningStepId] = useState<number | null>(null);
  const toggleStepSelected = useRecorderStore((s) => s.toggleStepSelected);
  const appendStep = useRecorderStore((s) => s.appendStep);
  const removeStep = useRecorderStore((s) => s.removeStep);
  const inspectorOpen = useRecorderStore((s) => s.inspectorOpen);
  const toggleInspector = useRecorderStore((s) => s.toggleInspector);
  const selectedCount = steps.filter((s) => s.selected).length;
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<number, StepProgress>>({});
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(0);
  const [delayUntil, setDelayUntil] = useState<number | null>(null);
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setClockNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [isRunning]);
  const elapsedMs =
    runStartedAt === null ? 0 : Math.max(0, clockNow - runStartedAt);
  const elapsed = `${Math.floor(elapsedMs / 60000)
    .toString()
    .padStart(2, '0')}:${Math.floor((elapsedMs / 1000) % 60)
    .toString()
    .padStart(2, '0')}.${Math.floor((elapsedMs % 1000) / 100)}`;
  const activeRow = useRef<HTMLDivElement>(null);
  const runLock = useRef(false);
  useEffect(
    () => () => {
      if (runLock.current) stopRun();
    },
    [],
  );
  useEffect(() => {
    activeRow.current?.scrollIntoView({ block: 'nearest' });
  }, [runningStepId]);

  const handleBulkDelete = () => {
    const ids = steps.filter((s) => s.selected).map((s) => s.id);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Excluir ${ids.length} step${ids.length === 1 ? '' : 's'} selecionado${ids.length === 1 ? '' : 's'}?`,
      )
    )
      return;
    ids.forEach((id) => removeStep(id));
  };
  const recorderTitle = useRecorderStore((s) => s.recorderTitle);
  const recordingSeconds = useRecorderStore((s) => s.recordingSeconds);
  const lastPoint = useRecorderStore((s) => s.lastCapturedPoint);
  const deviceName = useDeviceStore((s) => s.deviceName);
  const [runInfo, setRunInfo] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<
    'launchApp' | 'inputText' | 'variable' | 'secureKeypad'
  >('launchApp');
  const [addValue, setAddValue] = useState('');
  // Colunas do dataset — usadas apenas para popular o dropdown do +Add
  // quando o tipo é "variable". Edição das colunas/massas fica em
  // /variaveis (página dedicada).
  const datasetColumns = useDatasetStore((s) => s.columns);
  const datasetActiveRow = useDatasetStore((s) => s.rows[s.activeRowIndex]);
  const datasetCurrentName = useDatasetStore((s) => s.currentName);
  const datasetLibrary = useDatasetStore((s) => s.library);
  const datasetSwitch = useDatasetStore((s) => s.switchDataset);
  const datasetCreate = useDatasetStore((s) => s.createDataset);
  const moveStep = useRecorderStore((s) => s.moveStep);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Alvo do inputText por variável (opcional): resource-id do campo a focar
  const [addTargetResourceId, setAddTargetResourceId] = useState('');

  const handleRunAll = async () => {
    // Se já rodando → pausar
    if (runLock.current) {
      stopRun();
      setRunInfo('Pausando…');
      return;
    }
    const target = steps;
    if (target.length === 0) {
      setRunInfo('Sem steps para executar.');
      setTimeout(() => setRunInfo(null), 2500);
      return;
    }
    const startedAt = Date.now();
    setRunStartedAt(startedAt);
    setClockNow(startedAt);
    setDelayUntil(null);
    runLock.current = true;
    useRecorderStore.getState().stopRecording();
    setIsRunning(true);
    setResults({});
    try {
      const result = await runSteps(target, (i, step, progress) => {
        setDelayUntil(
          progress.status === 'waiting'
            ? Date.now() + (step.delayAfterMs ?? 0)
            : null,
        );
        setResults((previous) => ({ ...previous, [step.id]: progress }));
        setRunInfo(
          `Step ${i + 1}/${target.length}: ${stepDisplayLabel(step)} — ${progress.message}`,
        );
        setRunningStepId(
          ['running', 'waiting'].includes(progress.status) ? step.id : null,
        );
        onSelectStep(step.id);
      });
      setRunInfo(
        result.status === 'passed'
          ? result.message
          : `${result.status === 'cancelled' ? 'Cancelado' : 'Falha'} — ${result.completed}/${target.length} concluídos. ${result.message}`,
      );
    } finally {
      setClockNow(Date.now());
      setDelayUntil(null);
      setRunningStepId(null);
      setIsRunning(false);
      runLock.current = false;
    }
  };

  const recordingExport = useMemo(
    () =>
      buildRecordingExport({
        title: recorderTitle,
        recordingSeconds,
        steps,
        device: {
          displayWidth: lastPoint?.displayWidth ?? 0,
          displayHeight: lastPoint?.displayHeight ?? 0,
          name: deviceName ?? null,
        },
      }),
    [
      recorderTitle,
      recordingSeconds,
      steps,
      lastPoint?.displayWidth,
      lastPoint?.displayHeight,
      deviceName,
    ],
  );
  const handleExport = () => downloadRecordingJson(recordingExport);

  const handleImport = async () => {
    const raw = await pickJsonFile();
    if (raw === null) return; // cancelou
    let parsed: ReturnType<typeof parseRecordingImport>;
    try {
      const nextId = steps.reduce((m, s) => Math.max(m, s.id), 0) + 1;
      parsed = parseRecordingImport(raw, nextId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRunInfo(`Falha ao importar: ${msg}`);
      setTimeout(() => setRunInfo(null), 4000);
      return;
    }
    const append =
      steps.length === 0 ||
      window.confirm(
        `Você já tem ${steps.length} step${steps.length === 1 ? '' : 's'}. ` +
          `Adicionar os ${parsed.steps.length} do import ao final?\n\n` +
          `OK = anexar · Cancelar = deixar como está.`,
      );
    if (!append) return;
    parsed.steps.forEach((st) => appendStep(st));
    setRunInfo(
      `Importado: ${parsed.steps.length} step${parsed.steps.length === 1 ? '' : 's'} anexado${parsed.steps.length === 1 ? '' : 's'}.`,
    );
    setTimeout(() => setRunInfo(null), 3000);
  };

  const handleAddStep = () => {
    if (!addValue.trim()) return;
    const maxId = steps.reduce((m, s) => Math.max(m, s.id), 0);
    // Variable = inputText cujo valor é `{{coluna}}` (resolvido no playback)
    const isVariable = addType === 'variable';
    const stepType = isVariable ? 'inputText' : addType;
    const finalValue =
      isVariable || addType === 'secureKeypad' ? `{{${addValue}}}` : addValue;
    const label =
      addType === 'secureKeypad'
        ? `Digitar senha no teclado · {{${addValue}}}`
        : isVariable
          ? `Digitar {{${addValue}}}`
          : addType === 'launchApp'
            ? `Abrir app "${addValue}"`
            : `Digitar "${addValue}"`;

    // Se é variável e o usuário indicou um resource-id de campo, adiciona
    // como seletor no step — o playback vai focar esse campo antes de digitar.
    const selectors: Step['selectors'] =
      addType === 'launchApp'
        ? [
            {
              type: 'resourceId',
              value: addValue,
              stability: 'stable',
              recommended: true,
            },
          ]
        : isVariable && addTargetResourceId.trim()
          ? [
              {
                type: 'resourceId',
                value: addTargetResourceId.trim(),
                stability: 'stable',
                recommended: true,
              },
            ]
          : [];

    const newStep: Step = {
      id: maxId + 1,
      type: stepType,
      label,
      value: finalValue,
      time: '--:--',
      selected: false,
      selectors,
    };
    appendStep(newStep);
    setAddValue('');
    setAddTargetResourceId('');
    setShowAdd(false);
  };

  const convertPasswordTaps = (screen: Step, column: string) => {
    const start = steps.findIndex((item) => item.id === screen.id);
    if (start < 0 || !datasetColumns.includes(column)) return;
    const end = keypadTapEnd(steps, start);
    const removed = steps.slice(start + 1, end);
    const id = Math.max(0, ...steps.map((item) => item.id)) + 1;
    const marker = screen.screenSignature?.anchors.find(
      (anchor) =>
        anchor.type === 'resourceId' &&
        /:id\/btns_keyboard$/.test(anchor.value),
    );
    const secure: Step = {
      id,
      type: 'secureKeypad',
      label: `Digitar senha no teclado · {{${column}}}`,
      value: `{{${column}}}`,
      time: removed[0]?.time ?? screen.time,
      selected: false,
      delayAfterMs: removed.at(-1)?.delayAfterMs ?? 0,
      selectors: marker
        ? [{ ...marker, stability: 'stable', recommended: true }]
        : [],
    };
    useRecorderStore.setState((state) => ({
      steps: [
        ...state.steps.slice(0, start + 1),
        secure,
        ...state.steps.slice(end),
      ],
      selectedStepId: id,
    }));
    setExpanded(new Set([id]));
    setRunInfo(
      `Step de senha criado; ${removed.length} toque${removed.length === 1 ? '' : 's'} substituído${removed.length === 1 ? '' : 's'}.`,
    );
  };

  return (
    <div className="steps-panel">
      <div className="steps-panel__header">
        <span className="steps-panel__title">
          {phase === 'gravar' ? 'Steps gravados' : 'Steps'}
        </span>
        <span className="steps-panel__count">{steps.length}</span>
        <div className="steps-panel__spacer" />
        {isEditing && (
          <>
            {selectedCount > 0 && (
              <button
                type="button"
                className="steps-panel__icon-btn"
                onClick={handleBulkDelete}
                title={`Excluir ${selectedCount} selecionado${selectedCount === 1 ? '' : 's'}`}
                aria-label={`Excluir ${selectedCount} step${selectedCount === 1 ? '' : 's'} selecionado${selectedCount === 1 ? '' : 's'}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
                <span className="steps-panel__icon-badge">{selectedCount}</span>
              </button>
            )}

            {/* Dataset ativo (global) — silencioso mas presente */}
            <label
              className="steps-panel__icon-btn"
              title={`Dataset ativo: ${datasetCurrentName}. Todos os {{var}} resolvem por este.`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
                <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
              </svg>
              <select
                value={datasetCurrentName}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__new__') {
                    const name = window.prompt(
                      'Nome do novo dataset:',
                      `Dataset ${Object.keys(datasetLibrary).length + 1}`,
                    );
                    if (name?.trim()) datasetCreate(name.trim());
                    return;
                  }
                  datasetSwitch(v);
                }}
                aria-label="Dataset ativo (global)"
                className="steps-panel__dataset-select"
              >
                {Object.keys(datasetLibrary).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__new__">+ Novo…</option>
              </select>
            </label>

            <button
              type="button"
              className="steps-panel__icon-btn"
              onClick={handleImport}
              title="Importar JSON"
              aria-label="Importar sequência de steps de arquivo JSON"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>

            <button
              type="button"
              className="steps-panel__icon-btn"
              onClick={handleExport}
              disabled={steps.length === 0}
              title="Exportar JSON"
              aria-label="Exportar steps como JSON"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>

            <button
              type="button"
              className="steps-panel__icon-btn"
              onClick={() => setShowAdd((v) => !v)}
              title="Adicionar step"
              aria-label="Adicionar step manualmente"
              aria-expanded={showAdd}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <button
              type="button"
              className="steps-panel__icon-btn"
              onClick={handleRunAll}
              disabled={steps.length === 0}
              title={isRunning ? 'Pausar execução' : 'Executar steps'}
              aria-label={isRunning ? 'Pausar execução' : 'Executar steps'}
              aria-pressed={isRunning}
            >
              {isRunning ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              )}
            </button>

            {/* Toggle do sidesheet (Inspector) */}
            <button
              type="button"
              className="steps-panel__icon-btn"
              onClick={toggleInspector}
              title={
                inspectorOpen
                  ? 'Ocultar painel lateral'
                  : 'Mostrar painel lateral'
              }
              aria-label={
                inspectorOpen
                  ? 'Ocultar painel lateral'
                  : 'Mostrar painel lateral'
              }
              aria-pressed={inspectorOpen}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="15" y1="4" x2="15" y2="20" />
                {inspectorOpen && (
                  <rect
                    x="16"
                    y="6"
                    width="4"
                    height="12"
                    rx="0.5"
                    fill="currentColor"
                    opacity="0.35"
                    stroke="none"
                  />
                )}
              </svg>
            </button>
          </>
        )}
      </div>

      {showAdd && isEditing && (
        <div className="steps-panel__add-form">
          <div className="steps-panel__add-row">
            <select
              value={addType}
              onChange={(e) => {
                setAddType(
                  e.target.value as
                    'launchApp' | 'inputText' | 'variable' | 'secureKeypad',
                );
                setAddValue('');
              }}
              aria-label="Tipo de step"
              className="steps-panel__add-control"
            >
              <option value="launchApp">Abrir app (package)</option>
              <option value="inputText">Digitar texto literal</option>
              <option value="variable">Digitar variável do dataset</option>
              <option value="secureKeypad">Senha em teclado dinâmico</option>
            </select>
            {addType === 'variable' || addType === 'secureKeypad' ? (
              <select
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                aria-label={`Coluna do dataset "${datasetCurrentName}"`}
                className="steps-panel__add-control steps-panel__add-control--grow"
              >
                <option value="">
                  Coluna do dataset "{datasetCurrentName}"…
                </option>
                {datasetColumns.map((c) => {
                  const preview = datasetActiveRow?.[c];
                  return (
                    <option key={c} value={c}>
                      {`{{${c}}}${preview ? ` · "${preview}"` : ' · (vazio na massa ativa)'}`}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder={
                  addType === 'launchApp' ? 'com.itau.investimentos' : 'Texto…'
                }
                aria-label="Valor do step"
                className="steps-panel__add-control steps-panel__add-control--grow"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStep();
                }}
              />
            )}
            <button
              type="button"
              onClick={handleAddStep}
              className="steps-panel__header-btn"
              disabled={
                (addType === 'variable' || addType === 'secureKeypad') &&
                (!addValue || datasetColumns.length === 0)
              }
            >
              Adicionar
            </button>
          </div>
          {(addType === 'variable' || addType === 'secureKeypad') &&
            datasetColumns.length === 0 && (
              <div className="steps-panel__add-hint">
                Nenhuma coluna no dataset — vá em{' '}
                <strong>Dados → Datasets</strong> e crie colunas.
              </div>
            )}
          {addType === 'variable' && (
            <div>
              <input
                value={addTargetResourceId}
                onChange={(e) => setAddTargetResourceId(e.target.value)}
                placeholder="Focar campo (resource-id, opcional) — ex: com.itau:id/editText"
                aria-label="Resource ID do campo a focar antes de digitar"
                className="steps-panel__add-target"
              />
              <div className="steps-panel__add-hint">
                Se informado, o playback vai clicar nesse campo antes de digitar
                a variável.
              </div>
            </div>
          )}
        </div>
      )}

      {recording && captureStatus !== 'ready' && (
        <div role="status" className="steps-panel__run-info">
          {captureStatus === 'error'
            ? 'Não foi possível identificar a tela. Aguarde a leitura antes de tocar novamente.'
            : 'Preparando identificação da tela. Aguarde antes de tocar no device.'}
        </div>
      )}
      {runInfo && (
        <div className="steps-panel__run-info">
          <span role="status" aria-live="polite">
            {runInfo}
          </span>
          {runStartedAt !== null && (
            <output
              className="steps-panel__run-timer"
              role="timer"
              aria-live="off"
              aria-label="Tempo de execução"
            >
              {elapsed}
            </output>
          )}
          {isRunning && delayUntil !== null && (
            <span className="steps-panel__delay-remaining" aria-live="off">
              Limite restante:{' '}
              {Math.max(0, (delayUntil - clockNow) / 1000).toFixed(1)} s
            </span>
          )}
        </div>
      )}

      <div className="steps-panel__review-toolbar">
        <button
          type="button"
          className="steps-panel__header-btn"
          disabled={!steps.length}
          onClick={() => setExpanded(new Set(steps.map((step) => step.id)))}
        >
          Expandir todos
        </button>
        <button
          type="button"
          className="steps-panel__header-btn"
          disabled={!expanded.size}
          onClick={() => setExpanded(new Set())}
        >
          Recolher todos
        </button>
        <button
          type="button"
          className="steps-panel__header-btn"
          aria-expanded={showCode}
          aria-controls="recording-code"
          title="Show code"
          onClick={() => setShowCode(!showCode)}
        >
          {showCode ? 'Ocultar código' : 'Mostrar código'}
        </button>
        <button
          type="button"
          className="steps-panel__header-btn steps-panel__header-btn--save"
          disabled={
            !steps.length ||
            playbackRunning ||
            recording ||
            steps.some((step) => step.pending)
          }
          onClick={() => setSaveSteps(steps)}
        >
          Salvar bloco
        </button>
      </div>
      <div
        className={`steps-panel__workspace${showCode ? ' steps-panel__workspace--code' : ''}`}
      >
        <div className="steps-panel__list">
          {!steps.length && (
            <div className="steps-panel__empty">
              <strong>Sua gravação começa aqui</strong>
              <p>
                Inicie a gravação ou importe um JSON. Abra os steps para revisar
                seletores e configurações.
              </p>
            </div>
          )}
          {scenes.map((scene) => {
            const screen = scene.screen;
            const snapshot = screen ? screenshots[screen.id] : undefined;
            return (
              <div
                className={`steps-panel__scene${screen ? ' steps-panel__scene--screen' : ''}`}
                key={scene.entries[0].step.id}
              >
                <div className="steps-panel__evidence">
                  {screen &&
                    (snapshot ? (
                      <button
                        type="button"
                        className="steps-panel__thumbnail"
                        aria-label={`Ampliar captura do step ${screen.id}`}
                        onClick={() => setPreviewId(screen.id)}
                      >
                        <img
                          src={snapshot.dataUrl}
                          alt={`Miniatura da tela do step ${screen.id}`}
                        />
                      </button>
                    ) : (
                      <span className="steps-panel__no-capture">
                        Sem captura
                      </span>
                    ))}
                </div>
                <div className="steps-panel__scene-steps">
                  {scene.entries.map(({ step, index }) => {
                    const isSelected = step.id === selectedStepId;
                    const isOpen = expanded.has(step.id);
                    const isScreen = step.type === 'waitForPage';
                    const ActionIcon = STEP_ICONS[step.type];
                    const status = results[step.id]?.status;
                    const title = isScreen
                      ? step.screenSignature
                        ? screenDisplayName(step.screenSignature)
                        : stepDisplayLabel(step)
                      : STEP_LABELS[step.type];
                    return (
                      <div
                        key={step.id}
                        className={`steps-panel__section${isScreen ? ' steps-panel__section--screen' : ''}`}
                        data-status={status}
                      >
                        <div className="steps-panel__track">
                          <span
                            className="steps-panel__marker"
                            aria-hidden="true"
                          >
                            {status === 'failed' ? '×' : ''}
                          </span>
                          <button
                            type="button"
                            className="steps-panel__drag"
                            disabled={playbackRunning || recording}
                            aria-label={`Arrastar para reordenar step ${step.id}`}
                            title="Arraste para reordenar"
                            draggable={!playbackRunning && !recording}
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              setDragIndex(index);
                            }}
                            onDragEnd={() => {
                              setDragIndex(null);
                              setDragOverIndex(null);
                            }}
                          >
                            <GripVertical size={15} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="steps-panel__step-content">
                          <div
                            ref={
                              step.id === runningStepId ? activeRow : undefined
                            }
                            aria-current={
                              step.id === runningStepId ? 'step' : undefined
                            }
                            data-run-status={status}
                            role="group"
                            aria-label={`Step ${step.id}: ${stepDisplayLabel(step)}`}
                            onDragOver={(e) => {
                              if (
                                playbackRunning ||
                                recording ||
                                dragIndex === null
                              )
                                return;
                              e.preventDefault();
                              setDragOverIndex(index);
                            }}
                            onDragLeave={() => {
                              if (dragOverIndex === index)
                                setDragOverIndex(null);
                            }}
                            onDrop={(e) => {
                              if (
                                playbackRunning ||
                                recording ||
                                dragIndex === null
                              )
                                return;
                              e.preventDefault();
                              moveStep(dragIndex, index);
                              setDragIndex(null);
                              setDragOverIndex(null);
                            }}
                            className={`steps-panel__item${isSelected ? ' steps-panel__item--active' : ''}${step.pending ? ' steps-panel__item--pending' : ''}${step.id === runningStepId ? ' steps-panel__item--running' : ''}${dragOverIndex === index && dragIndex !== index ? ' steps-panel__item--drag-over' : ''}`}
                          >
                            <input
                              type="checkbox"
                              className="steps-panel__checkbox"
                              checked={step.selected}
                              onChange={() => toggleStepSelected(step.id)}
                              aria-label={`Selecionar step ${step.id}`}
                              title="Seleção para ações em lote. Play executa a lista inteira."
                            />
                            <button
                              type="button"
                              className="steps-panel__summary"
                              aria-expanded={isOpen}
                              aria-controls={`step-details-${step.id}`}
                              aria-label={`${isOpen ? 'Recolher' : 'Expandir'} step ${step.id}: ${stepDisplayLabel(step)}`}
                              onClick={() => toggleDetails(step.id)}
                            >
                              <span
                                className="steps-panel__chevron"
                                aria-hidden="true"
                              >
                                {isOpen ? '▾' : '▸'}
                              </span>
                              <span className="steps-panel__item-body">
                                <span className="steps-panel__item-type">
                                  <span
                                    className="steps-panel__action-icon"
                                    data-type={step.type}
                                  >
                                    <ActionIcon size={14} aria-hidden="true" />
                                  </span>
                                  {title}
                                </span>
                                <span className="steps-panel__item-label">
                                  {isScreen
                                    ? (step.screenSignature?.packageName ??
                                      step.value)
                                    : stepDisplayLabel(step)}
                                </span>
                              </span>
                            </button>
                            {(step.delayAfterMs ?? 0) > 0 && (
                              <button
                                type="button"
                                className="steps-panel__delay-summary"
                                aria-label={`Configurar delay do step ${step.id}`}
                                title="Delay máximo até o próximo passo"
                                onClick={() => {
                                  onSelectStep(step.id);
                                  setExpanded(
                                    (previous) =>
                                      new Set([...previous, step.id]),
                                  );
                                }}
                              >
                                até{' '}
                                {(step.delayAfterMs! / 1000).toLocaleString(
                                  'pt-BR',
                                  { maximumFractionDigits: 1 },
                                )}{' '}
                                s
                              </button>
                            )}
                            {status && (
                              <span
                                className={`steps-panel__result steps-panel__result--${status}`}
                                title={results[step.id].message}
                              >
                                {
                                  {
                                    running: 'Executando',
                                    waiting: 'Delay',
                                    passed: 'Passou',
                                    failed: 'Falhou',
                                    cancelled: 'Cancelado',
                                  }[status]
                                }
                              </span>
                            )}
                          </div>
                          {status === 'failed' && (
                            <div
                              className="steps-panel__item-error"
                              role="alert"
                            >
                              {results[step.id].message}
                            </div>
                          )}
                          {isOpen && (
                            <div className="steps-panel__expanded">
                              <div className="steps-panel__step-tools">
                                <span>Step {index + 1}</span>
                                <span>Alça de reordenação na trilha</span>
                              </div>
                              <StepDetails
                                step={step}
                                index={index}
                                disabled={playbackRunning || recording}
                                onSave={() => setSaveSteps([step])}
                                onConvertPassword={(column) =>
                                  convertPasswordTaps(step, column)
                                }
                                passwordTapCount={
                                  step.type === 'waitForPage'
                                    ? keypadTapEnd(steps, index) - index - 1
                                    : 0
                                }
                                passwordStepPresent={
                                  step.type === 'waitForPage' &&
                                  steps[index + 1]?.type === 'secureKeypad'
                                }
                                onShowCode={() => {
                                  onSelectStep(step.id);
                                  setCodeScope('step');
                                  setShowCode(true);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {showCode && (
          <RecordingCode
            recording={recordingExport}
            selectedIndex={steps.findIndex(
              (step) => step.id === selectedStepId,
            )}
            scope={codeScope}
            onScope={setCodeScope}
            onClose={() => setShowCode(false)}
          />
        )}
      </div>
      {previewId !== null && screenshots[previewId] && (
        <SnapshotPreview
          snapshot={screenshots[previewId]}
          stepId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
      {saveSteps && (
        <SaveBlockDialog
          steps={saveSteps}
          defaultName={
            saveSteps.length === 1
              ? stepDisplayLabel(saveSteps[0])
              : recorderTitle
          }
          onClose={() => setSaveSteps(null)}
        />
      )}

      {phase === 'gravar' && (
        <div className="steps-panel__tip">
          As miniaturas registram as telas reconhecidas e ficam disponíveis
          nesta sessão.
        </div>
      )}
    </div>
  );
}
