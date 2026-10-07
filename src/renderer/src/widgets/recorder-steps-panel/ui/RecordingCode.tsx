import type { FlowRecordingExport } from '@/features/flow-export';
import { downloadRecordingJson } from '@/features/flow-export';
import { CopyButton } from './CopyButton';
import './recording-code.scss';

export function RecordingCode({
  recording,
  selectedIndex,
  scope,
  onScope,
  onClose,
}: {
  recording: FlowRecordingExport;
  selectedIndex: number;
  scope: 'flow' | 'step';
  onScope: (scope: 'flow' | 'step') => void;
  onClose: () => void;
}) {
  const selected = recording.steps[selectedIndex];
  const json = JSON.stringify(
    scope === 'flow' ? recording : (selected ?? null),
    null,
    2,
  );
  return (
    <aside
      className="recording-code"
      id="recording-code"
      aria-label="Código da gravação"
    >
      <div className="recording-code__header">
        <strong>JSON da captura</strong>
        <button type="button" onClick={onClose} aria-label="Fechar código">
          ×
        </button>
      </div>
      <div className="recording-code__toolbar">
        <label>
          Exibir{' '}
          <select
            aria-label="Escopo do JSON"
            value={scope}
            onChange={(e) => onScope(e.target.value as 'flow' | 'step')}
          >
            <option value="flow">Fluxo inteiro</option>
            <option value="step" disabled={!selected}>
              Step selecionado
            </option>
          </select>
        </label>
        <CopyButton text={json} label="Copiar JSON exibido" />
        <button type="button" onClick={() => downloadRecordingJson(recording)}>
          Baixar fluxo
        </button>
      </div>
      <p className="recording-code__hint">
        Somente leitura · acompanha suas edições · imagens ficam nesta sessão.
      </p>
      {scope === 'step' && !selected ? (
        <p className="recording-code__hint">
          Selecione um step para ver seu JSON.
        </p>
      ) : (
        <textarea
          className="recording-code__source"
          aria-label="JSON da gravação"
          readOnly
          spellCheck={false}
          value={json}
        />
      )}
    </aside>
  );
}
