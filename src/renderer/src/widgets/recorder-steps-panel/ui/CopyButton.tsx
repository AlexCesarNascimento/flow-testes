import { useState } from 'react';
import './copy-button.scss';

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  return (
    <span className="copy-button">
      <button
        type="button"
        aria-label={label}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setStatus('copied');
          } catch {
            setStatus('error');
          }
        }}
      >
        Copiar
      </button>
      <span role="status">
        {status === 'copied'
          ? 'Copiado'
          : status === 'error'
            ? 'Não foi possível copiar.'
            : ''}
      </span>
    </span>
  );
}
