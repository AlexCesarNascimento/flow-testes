import { Play, Crosshair } from 'lucide-react';
import { useStore } from '../store';
import DeviceFrame from '../components/Recorder/DeviceFrame';

// ── Coluna Esquerda — Dispositivo ─────────────────────────────────────────────
function DispositivoPanel() {
  return (
    <div
      style={{
        width: 300,
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          Dispositivo
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--color-text-3)',
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: '2px 7px',
          }}
        >
          PRONTO
        </span>
      </div>

      {/* Conteúdo */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <DeviceFrame phase="editar" />
      </div>
    </div>
  );
}

// ── Coluna Central — Execução ─────────────────────────────────────────────────
function ExecucaoPanel() {
  const { device, ambiente } = useStore();

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--color-text-3)',
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: '2px 7px',
          }}
        >
          PRONTO
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--color-text-1)',
          }}
        >
          Execução #24
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--color-text-3)',
          }}
        >
          {device.split(' · ')[0]} · {ambiente}
        </span>
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
        <Play
          size={36}
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
          Nenhuma execução ainda
        </div>
        <div
          style={{
            color: 'var(--color-text-2)',
            fontSize: 13,
            textAlign: 'center',
            maxWidth: 360,
            lineHeight: 1.6,
          }}
        >
          Monte o Flow e clique em Executar. Você acompanha cada step, pausa,
          avança passo a passo e volta no tempo.
        </div>

        {/* Botão Executar */}
        <button
          style={{
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '10px 22px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Play size={15} fill="currentColor" />
          Executar o Flow atual
        </button>
      </div>
    </div>
  );
}

// ── Coluna Direita — Detalhe do step ─────────────────────────────────────────
function DetalhePanel() {
  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          fontWeight: 600,
          fontSize: 13,
          color: 'var(--color-text-1)',
        }}
      >
        Detalhe do step
      </div>

      {/* Estado vazio */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: 24,
        }}
      >
        <Crosshair
          size={32}
          style={{ color: 'var(--color-text-3)' }}
          strokeWidth={1.5}
        />
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--color-text-1)',
            textAlign: 'center',
          }}
        >
          Selecione um step
        </div>
        <div
          style={{
            color: 'var(--color-text-2)',
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          Clique em qualquer step da execução para ver o que o app mostrava
          antes e depois, e o que o agente encontrou enquanto ela rodava.
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ExecucaoAtualPage() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <DispositivoPanel />
      <ExecucaoPanel />
      <DetalhePanel />
    </div>
  );
}
