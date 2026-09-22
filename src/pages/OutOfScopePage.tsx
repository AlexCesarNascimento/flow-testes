import { Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OutOfScopePage({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
        color: 'var(--color-text-2)',
      }}
    >
      <Layers size={32} strokeWidth={1.5} />
      <div
        style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-1)' }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          textAlign: 'center',
          maxWidth: 380,
          color: 'var(--color-text-3)',
        }}
      >
        Esta área fica fora do escopo deste protótipo. O foco é o ciclo gravar →
        editar → parametrizar → executar → depurar.
      </div>
      <button
        onClick={() => navigate('/recorder')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid var(--color-border-strong)',
          background: 'var(--color-elevated)',
          color: 'var(--color-text-2)',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        Voltar ao Recorder
      </button>
    </div>
  );
}
