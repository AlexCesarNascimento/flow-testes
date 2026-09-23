import { useParams, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useStore } from '../store';

type Tab = 'datasets' | 'variaveis' | 'ambientes' | 'secrets';

const TABS: { id: Tab; label: string }[] = [
  { id: 'datasets', label: 'Datasets' },
  { id: 'variaveis', label: 'Variáveis' },
  { id: 'ambientes', label: 'Ambientes' },
  { id: 'secrets', label: 'Secrets' },
];

function TabBar({
  active,
  counts,
}: {
  active: Tab;
  counts: Record<Tab, number>;
}) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        gap: 0,
      }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => navigate(`/dados/${t.id}`)}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-text-1)' : 'var(--color-text-2)',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? '2px solid var(--color-accent)'
                : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: -1,
            }}
          >
            {t.label}
            <span
              style={{
                fontSize: 11,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-3)',
                background: isActive
                  ? 'var(--color-accent-bg)'
                  : 'var(--color-elevated)',
                border: `1px solid ${isActive ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)' : 'var(--color-border)'}`,
                borderRadius: 10,
                padding: '0 6px',
                lineHeight: '16px',
              }}
            >
              {counts[t.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Tab Datasets ─────────────────────────────────────────────────────────────
function TabDatasets() {
  const { datasetRows, ambiente } = useStore();
  const activeCount = datasetRows.filter((r) => r.active).length;

  return (
    <div style={{ padding: 20 }}>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-2)',
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--color-text-1)' }}>
          clientes_varejo
        </strong>{' '}
        — cada linha ativa é um conjunto de dados. No Flow, o bloco "Para cada
        linha do dataset" repete os passos com uma linha por vez; na matriz,
        cada linha vira uma execução por device.
      </p>

      {/* Tabela */}
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          overflow: 'hidden',
          fontSize: 12,
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 1.5fr 1fr 1fr 80px',
            background: 'var(--color-elevated)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 8px',
          }}
        >
          {['USAR', 'ID', 'LOGIN', 'SENHA', 'SAUDACAO', 'TIPO'].map((col) => (
            <div
              key={col}
              style={{
                padding: '8px 6px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-3)',
                letterSpacing: '0.05em',
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Linhas */}
        {datasetRows.map((row, i) => (
          <div
            key={row.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '44px 1fr 1.5fr 1fr 1fr 80px',
              padding: '0 8px',
              borderBottom:
                i < datasetRows.length - 1
                  ? '1px solid var(--color-border)'
                  : 'none',
              background: 'var(--color-surface)',
            }}
          >
            {/* Checkbox */}
            <div
              style={{
                padding: '10px 6px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: row.active
                    ? 'var(--color-accent)'
                    : 'transparent',
                  border: `2px solid ${row.active ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {row.active && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="#000"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>

            {[row.id, row.login, row.senha, row.saudacao, row.tipo].map(
              (val, vi) => (
                <div
                  key={vi}
                  style={{
                    padding: '10px 6px',
                    color: 'var(--color-text-1)',
                    fontFamily: vi === 2 ? 'monospace' : 'inherit',
                    fontSize: vi === 2 ? 14 : 12,
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {val}
                </div>
              ),
            )}
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <p
        style={{
          marginTop: 12,
          fontSize: 12,
          color: 'var(--color-text-3)',
        }}
      >
        {activeCount} linhas ativas × 3 devices = {activeCount * 3} execuções no
        ambiente {ambiente}
      </p>
    </div>
  );
}

// ── Tab Variáveis ─────────────────────────────────────────────────────────────
function TabVariaveis() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 20 }}>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-2)',
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        Variáveis existem no escopo do Flow. Cada parâmetro de uma Action vira
        uma variável que você liga a um valor fixo, a uma coluna do dataset ou a
        um secret.
      </p>

      {/* Estado vazio */}
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '16px 20px',
          color: 'var(--color-text-2)',
          fontSize: 13,
          background: 'var(--color-surface)',
          marginBottom: 16,
        }}
      >
        Nenhuma variável ainda. Salve uma Action com parâmetros e adicione ao
        Flow.
      </div>

      <button
        onClick={() => navigate('/flows')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 7,
          border: '1px solid var(--color-border-strong)',
          background: 'var(--color-elevated)',
          color: 'var(--color-text-1)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="22 12 18 8 14 12" />
          <line x1="18" y1="8" x2="18" y2="16" />
          <path d="M2 12h16" />
        </svg>
        Ir para o Flow
      </button>
    </div>
  );
}

// ── Tab Ambientes ─────────────────────────────────────────────────────────────
function TabAmbientes() {
  const { ambientes } = useStore();
  return (
    <div style={{ padding: 20 }}>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-2)',
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        O ambiente muda o pacote do app, a URL da API e quais secrets estão
        disponíveis. Escolher um aqui altera o seletor no topo.
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        {ambientes.map((a) => (
          <div
            key={a.name}
            style={{
              flex: 1,
              border: `1px solid ${a.active ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 10,
              padding: 16,
              background: a.active
                ? 'color-mix(in srgb, var(--color-accent) 5%, var(--color-surface))'
                : 'var(--color-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'var(--color-text-1)',
                }}
              >
                {a.name}
              </span>
              {a.active && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--color-accent)',
                    background: 'var(--color-accent-bg)',
                    border:
                      '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                    borderRadius: 4,
                    padding: '1px 6px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ATIVO
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: 'var(--color-text-2)',
                marginBottom: 4,
              }}
            >
              {a.packageId}
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: 'var(--color-text-2)',
                marginBottom: 10,
              }}
            >
              {a.apiUrl}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-2)',
                lineHeight: 1.5,
              }}
            >
              {a.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab Secrets ───────────────────────────────────────────────────────────────
function TabSecrets() {
  const { secrets } = useStore();
  return (
    <div style={{ padding: 20 }}>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-2)',
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        Secrets ficam no cofre do projeto. O valor nunca aparece em logs,
        screenshots ou relatórios — só o nome.
      </p>

      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {secrets.map((s, i) => (
          <div
            key={s.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderBottom:
                i < secrets.length - 1
                  ? '1px solid var(--color-border)'
                  : 'none',
              background: 'var(--color-surface)',
            }}
          >
            <Lock
              size={14}
              style={{ color: 'var(--color-text-3)', flexShrink: 0 }}
              strokeWidth={1.5}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text-1)',
                fontFamily: 'monospace',
                minWidth: 140,
              }}
            >
              {s.name}
            </span>
            <span
              style={{
                fontSize: 14,
                color: 'var(--color-text-3)',
                letterSpacing: 3,
                flex: 1,
              }}
            >
              ••••••••••
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DadosPage() {
  const { tab } = useParams<{ tab?: string }>();
  const { datasetRows, ambientes, secrets } = useStore();

  const activeTab: Tab =
    tab === 'variaveis' || tab === 'ambientes' || tab === 'secrets'
      ? tab
      : 'datasets';

  const counts: Record<Tab, number> = {
    datasets: datasetRows.length,
    variaveis: 0,
    ambientes: ambientes.length,
    secrets: secrets.length,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <TabBar active={activeTab} counts={counts} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'datasets' && <TabDatasets />}
        {activeTab === 'variaveis' && <TabVariaveis />}
        {activeTab === 'ambientes' && <TabAmbientes />}
        {activeTab === 'secrets' && <TabSecrets />}
      </div>
    </div>
  );
}
