import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store';

const DEVICES = [
  { id: 'pixel7', name: 'Pixel 7', os: 'Android 14' },
  { id: 'galaxy', name: 'Galaxy S23', os: 'Android 14' },
  { id: 'emulator', name: 'Emulator API 35', os: 'Android 15' },
];

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 38,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: value ? 'var(--color-blue)' : 'var(--color-elevated)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
        outline: value
          ? '1px solid color-mix(in srgb, var(--color-blue) 50%, transparent)'
          : '1px solid var(--color-border-strong)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 18 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        background: checked ? 'var(--color-accent)' : 'transparent',
        border: `2px solid ${checked ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {checked && (
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
  );
}

// ── Coluna Esquerda — Configurar matriz ───────────────────────────────────────
function ConfigurarPanel() {
  const { datasetRows, ambiente } = useStore();
  const [selectedRows, setSelectedRows] = useState<string[]>(
    datasetRows.map((r) => r.id),
  );
  const [selectedDevices, setSelectedDevices] = useState<string[]>(
    DEVICES.map((d) => d.id),
  );
  const [continuarAposFalha, setContinuarAposFalha] = useState(true);
  const [paralelo, setParalelo] = useState(true);
  const [simularRegressao, setSimularRegressao] = useState(false);

  const toggleRow = (id: string) =>
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  const toggleDevice = (id: string) =>
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          fontWeight: 600,
          fontSize: 13,
          color: 'var(--color-text-1)',
        }}
      >
        Configurar matriz
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* DATASET */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-3)',
              marginBottom: 10,
            }}
          >
            DATASET · CLIENTES_VAREJO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {datasetRows.map((row) => (
              <button
                key={row.id}
                onClick={() => toggleRow(row.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-elevated)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Checkbox checked={selectedRows.includes(row.id)} />
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--color-text-1)',
                    }}
                  >
                    {row.id}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                    {row.login}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* DEVICES */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-3)',
              marginBottom: 10,
            }}
          >
            DEVICES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEVICES.map((d) => (
              <button
                key={d.id}
                onClick={() => toggleDevice(d.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-elevated)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Checkbox checked={selectedDevices.includes(d.id)} />
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--color-text-1)',
                    }}
                  >
                    {d.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                    {d.os}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AMBIENTE */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-3)',
              marginBottom: 10,
            }}
          >
            AMBIENTE
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-elevated)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-1)',
                flex: 1,
              }}
            >
              {ambiente}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
              troque no topo
            </span>
          </div>
        </div>

        {/* TOGGLES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              label: 'Continuar após falha',
              value: continuarAposFalha,
              onChange: setContinuarAposFalha,
            },
            {
              label: 'Executar devices em paralelo',
              value: paralelo,
              onChange: setParalelo,
            },
            {
              label: 'Simular regressão no app',
              value: simularRegressao,
              onChange: setSimularRegressao,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-text-1)' }}>
                {item.label}
              </span>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Coluna Direita — Resultado por combinação ─────────────────────────────────
function ResultadoPanel() {
  const { datasetRows } = useStore();

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          fontWeight: 600,
          fontSize: 13,
          color: 'var(--color-text-1)',
        }}
      >
        Resultado por combinação
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Warning */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 8,
            border:
              '1px solid color-mix(in srgb, var(--color-amber) 40%, transparent)',
            background:
              'color-mix(in srgb, var(--color-amber) 8%, var(--color-surface))',
            marginBottom: 16,
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: 'var(--color-amber)', flexShrink: 0, marginTop: 1 }}
          />
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-2)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            O Flow atual falha em todas as combinações: Texto "Olá, Alex" não
            ficou visível em 10 s. Corrija no Flow antes de rodar.
          </p>
        </div>

        {/* Grid de combinações */}
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            overflow: 'hidden',
            fontSize: 12,
          }}
        >
          {/* Cabeçalho: vazio + 3 devices */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px repeat(3, 1fr)',
              background: 'var(--color-elevated)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ padding: '10px 12px' }} />
            {DEVICES.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: '10px 12px',
                  borderLeft: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-text-1)' }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                  {d.os}
                </div>
              </div>
            ))}
          </div>

          {/* Linhas: clientes × devices */}
          {datasetRows.map((row, ri) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px repeat(3, 1fr)',
                borderBottom:
                  ri < datasetRows.length - 1
                    ? '1px solid var(--color-border)'
                    : 'none',
              }}
            >
              {/* Identificação do cliente */}
              <div
                style={{
                  padding: '12px 12px',
                  background: 'var(--color-surface)',
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    color: 'var(--color-text-1)',
                    fontSize: 12,
                  }}
                >
                  {row.id}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                  {row.login}
                </div>
              </div>

              {/* Células por device */}
              {DEVICES.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: '12px 12px',
                    borderLeft: '1px solid var(--color-border)',
                    background: 'var(--color-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {/* Radio inativo */}
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: '2px solid var(--color-border-strong)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                    pronto
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Nota de rodapé */}
        <p
          style={{
            marginTop: 12,
            fontSize: 12,
            color: 'var(--color-text-3)',
            lineHeight: 1.6,
          }}
        >
          Clique em uma célula para ligar ou desligar a combinação. Depois
          execute a matriz — ligue "Simular regressão" para ver uma falha por
          device.
        </p>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MatrizPage() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <ConfigurarPanel />
      <ResultadoPanel />
    </div>
  );
}
