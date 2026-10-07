import { useEffect, useRef } from 'react';
import { Trash2, Activity } from 'lucide-react';
import { useFlowStore, type LogLevel } from '@/entities/flow';

const LEVEL_LABEL: Record<LogLevel, string> = {
  info: 'INFO',
  success: 'OK',
  warn: 'AVISO',
  error: 'ERRO',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function TrackingPanel() {
  const logs = useFlowStore((s) => s.logs);
  const clearLogs = useFlowStore((s) => s.clearLogs);
  const isPlaying = useFlowStore((s) => s.isPlaying);
  const listRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [logs.length]);

  const hasErrors = logs.some((l) => l.level === 'error');

  return (
    <div className="tracking-panel">
      <div className="tracking-panel__header">
        <span className="tracking-panel__title">
          <Activity size={13} aria-hidden="true" />
          Tracking
        </span>
        <span
          className={`tracking-panel__status${isPlaying ? ' tracking-panel__status--on' : ''}${
            hasErrors ? ' tracking-panel__status--error' : ''
          }`}
          aria-hidden="true"
        />
        <button
          type="button"
          className="tracking-panel__clear"
          onClick={clearLogs}
          disabled={logs.length === 0}
          aria-label="Limpar tracking"
        >
          <Trash2 size={12} aria-hidden="true" />
        </button>
      </div>
      <div className="tracking-panel__body">
        {logs.length === 0 ? (
          <p className="tracking-panel__empty">
            Nenhum evento ainda. Pressione Play para começar a simulação — cada
            passo do fluxo aparece aqui com tempo, nível e detalhes.
          </p>
        ) : (
          <ol ref={listRef} className="tracking-panel__list">
            {logs.map((entry) => (
              <li
                key={entry.id}
                className={`tracking-panel__entry tracking-panel__entry--${entry.level}`}
              >
                <span className="tracking-panel__time">
                  {formatTime(entry.timestamp)}
                </span>
                <span
                  className={`tracking-panel__level tracking-panel__level--${entry.level}`}
                >
                  {LEVEL_LABEL[entry.level]}
                </span>
                <span className="tracking-panel__message">{entry.message}</span>
                {entry.nodeLabel && (
                  <span
                    className="tracking-panel__node-ref"
                    title={entry.nodeId}
                  >
                    {entry.nodeLabel}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
