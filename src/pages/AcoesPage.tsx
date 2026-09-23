import { Zap } from 'lucide-react';

export default function AcoesPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header interno */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--color-text-1)',
            }}
          >
            Ações
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-text-3)',
              background: 'var(--color-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              padding: '0 7px',
              lineHeight: '18px',
            }}
          >
            0
          </span>
        </div>
      </div>

      {/* Estado vazio centralizado */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 32,
        }}
      >
        <Zap
          size={32}
          style={{ color: 'var(--color-text-3)' }}
          strokeWidth={1.5}
        />
        <div
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--color-text-1)',
            textAlign: 'center',
          }}
        >
          Nenhuma Action ainda
        </div>
        <div
          style={{
            color: 'var(--color-text-2)',
            fontSize: 13,
            textAlign: 'center',
            maxWidth: 380,
            lineHeight: 1.6,
          }}
        >
          Grave um fluxo, parametrize os valores e salve como Action. Ela vira
          um bloco reutilizável em qualquer Flow.
        </div>
      </div>
    </div>
  );
}
