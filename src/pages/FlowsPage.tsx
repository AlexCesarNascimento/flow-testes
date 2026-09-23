import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Pencil,
  Undo2,
  Redo2,
  Trash2,
  Table2,
} from 'lucide-react';
import { useStore } from '../store';

// ── Dados dos blocos da paleta ────────────────────────────────────────────────
const BLOCK_SECTIONS = [
  {
    id: 'acoes',
    label: 'MINHAS AÇÕES',
    color: 'var(--color-red)',
    count: 0,
    defaultOpen: true,
    blocks: [] as string[],
    emptyMsg:
      'Nenhuma Action ainda. Grave um fluxo e salve como Action para encaixar aqui.',
  },
  {
    id: 'device',
    label: 'APP / DEVICE',
    color: 'var(--color-accent)',
    count: 8,
    defaultOpen: false,
    blocks: [
      'Abrir app',
      'Fechar app',
      'Reiniciar app',
      'Screenshot',
      'Voltar',
      'Home',
      'Rotacionar',
      'Shake',
    ],
  },
  {
    id: 'interacao',
    label: 'INTERAÇÃO',
    color: 'var(--color-purple)',
    count: 6,
    defaultOpen: true,
    blocks: ['Tap', 'Long press', 'Digitar', 'Swipe', 'Scroll', 'Key event'],
  },
  {
    id: 'validacao',
    label: 'VALIDAÇÃO',
    color: 'var(--color-blue)',
    count: 3,
    defaultOpen: false,
    blocks: ['Verificar texto', 'Verificar elemento', 'Verificar ausência'],
  },
  {
    id: 'controle',
    label: 'CONTROLE',
    color: 'var(--color-amber)',
    count: 6,
    defaultOpen: true,
    blocks: [
      'Repetir N vezes',
      'Para cada linha',
      'Se / Senão',
      'Aguardar',
      'Parar',
      'Comentário',
    ],
  },
];

// Cores por seção para blocos
const SECTION_BLOCK_COLOR: Record<string, string> = {
  device: '#3b82f6',
  interacao: '#7c3aed',
  validacao: '#0ea5e9',
  controle: '#d97706',
};

// ── Coluna Esquerda — Blocos ──────────────────────────────────────────────────
function BlocosPanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(BLOCK_SECTIONS.map((s) => [s.id, s.defaultOpen])),
  );

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      style={{
        width: 240,
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
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--color-text-1)',
            marginBottom: 10,
          }}
        >
          Blocos
        </div>

        {/* Campo busca */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            padding: '6px 8px',
          }}
        >
          <Search
            size={12}
            style={{ color: 'var(--color-text-3)', flexShrink: 0 }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar bloco ou Action"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              color: 'var(--color-text-1)',
            }}
          />
        </div>
      </div>

      {/* Seções de blocos */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {BLOCK_SECTIONS.map((section) => {
          const isOpen = openSections[section.id];
          const filteredBlocks = section.blocks.filter((b) =>
            b.toLowerCase().includes(search.toLowerCase()),
          );
          const showSection =
            !search ||
            filteredBlocks.length > 0 ||
            (section.id === 'acoes' && !search);

          if (!showSection) return null;

          return (
            <div key={section.id} style={{ marginBottom: 2 }}>
              {/* Cabeçalho da seção */}
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '6px 14px',
                  gap: 6,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: section.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-3)',
                  }}
                >
                  {section.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    marginRight: 4,
                  }}
                >
                  {section.count}
                </span>
                {isOpen ? (
                  <ChevronUp
                    size={12}
                    style={{ color: 'var(--color-text-3)' }}
                  />
                ) : (
                  <ChevronDown
                    size={12}
                    style={{ color: 'var(--color-text-3)' }}
                  />
                )}
              </button>

              {/* Conteúdo */}
              {isOpen && (
                <div style={{ padding: '4px 14px 6px' }}>
                  {section.id === 'acoes' && section.blocks.length === 0 ? (
                    <>
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-3)',
                          lineHeight: 1.5,
                          marginBottom: 8,
                        }}
                      >
                        {section.emptyMsg}
                      </p>
                      <button
                        onClick={() => navigate('/recorder')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--color-border-strong)',
                          background: 'var(--color-elevated)',
                          color: 'var(--color-text-1)',
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 14 }}>●</span>
                        Gravar uma Action
                      </button>
                    </>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      {filteredBlocks.map((block) => (
                        <div
                          key={block}
                          draggable
                          style={{
                            padding: '7px 10px',
                            borderRadius: 6,
                            background:
                              SECTION_BLOCK_COLOR[section.id] ??
                              'var(--color-elevated)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'grab',
                            userSelect: 'none',
                          }}
                        >
                          {block}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Canvas — blocos Scratch ───────────────────────────────────────────────────
function ScratchBlock({
  color,
  children,
  indent = 0,
}: {
  color: string;
  children: React.ReactNode;
  indent?: number;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 8,
        background: color,
        fontSize: 13,
        fontWeight: 500,
        color: '#fff',
        marginLeft: indent * 20,
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        minWidth: 200,
      }}
    >
      {children}
    </div>
  );
}

function CanvasPanel() {
  const { recorderTitle } = useStore();

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
      {/* Toolbar do canvas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Título do flow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--color-text-1)',
            }}
          >
            {recorderTitle}
          </span>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-3)',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Pencil size={13} />
          </button>
        </div>

        {/* Botão Exemplo */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--color-border-strong)',
            background: 'var(--color-elevated)',
            color: 'var(--color-text-1)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Table2 size={13} />
          Exemplo: várias contas
        </button>

        {/* Undo / Redo / Lixeira */}
        {[
          { Icon: Undo2, label: 'Desfazer' },
          { Icon: Redo2, label: 'Refazer' },
          { Icon: Trash2, label: 'Limpar' },
        ].map(({ Icon, label }) => (
          <button
            key={label}
            title={label}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-elevated)',
              color: 'var(--color-text-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>

      {/* Área de canvas com grade de pontos */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          backgroundImage:
            'radial-gradient(circle, color-mix(in srgb, var(--color-border) 80%, transparent) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Blocos empilhados */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Bloco 1 — quando Executar o Flow */}
          <ScratchBlock color="#16a34a">
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="8" height="10" viewBox="0 0 8 10" fill="white">
                <path d="M0 0l8 5-8 5V0z" />
              </svg>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>quando</span>
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
                fontWeight: 700,
              }}
            >
              Executar o Flow
            </span>
          </ScratchBlock>

          {/* Bloco 2 — abrir app */}
          <ScratchBlock color="#2563eb" indent={1}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>abrir app</span>
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
                fontWeight: 600,
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            >
              com.exemplo.app.hml
            </span>
          </ScratchBlock>

          {/* Bloco 3 — esperar texto aparecer */}
          <ScratchBlock color="#16a34a" indent={1}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
              esperar texto
            </span>
            <span
              style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Olá, Alex
              <ChevronDown size={12} style={{ opacity: 0.7 }} />
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>aparecer</span>
          </ScratchBlock>
        </div>
      </div>
    </div>
  );
}

// ── Coluna Direita — Propriedades ─────────────────────────────────────────────
function PropriedadesPanel() {
  const { datasetRows } = useStore();

  const datasetColumns = [
    'linha.id',
    'linha.login',
    'linha.saudacao',
    'linha.senha',
    'linha.tipo',
  ];

  return (
    <div
      style={{
        width: 240,
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
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          fontWeight: 600,
          fontSize: 13,
          color: 'var(--color-text-1)',
        }}
      >
        Propriedades
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {/* Texto explicativo */}
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-text-2)',
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          Clique em um bloco para ver seus campos.{' '}
          <span
            style={{
              background:
                'color-mix(in srgb, var(--color-amber) 20%, transparent)',
              color: 'var(--color-amber)',
              borderRadius: 3,
              padding: '0 4px',
              fontWeight: 600,
            }}
          >
            brancos
          </span>{' '}
          aceitam um valor fixo ou uma coluna do dataset. Arraste a peça laranja
          para dentro do campo.
        </p>

        {/* VARIÁVEIS DO FLOW */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-3)',
              marginBottom: 8,
            }}
          >
            VARIÁVEIS DO FLOW
          </div>
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 12,
              color: 'var(--color-text-3)',
              background: 'var(--color-elevated)',
            }}
          >
            Nenhuma variável ainda — arraste a peça laranja para um campo branco
            de qualquer bloco.
          </div>
        </div>

        {/* COLUNAS DO DATASET */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-3)',
              marginBottom: 8,
            }}
          >
            COLUNAS DO DATASET
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-2)',
              marginBottom: 8,
            }}
          >
            clientes_varejo · {datasetRows.length} linhas
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {datasetColumns.map((col) => (
              <span
                key={col}
                draggable
                style={{
                  background:
                    'color-mix(in srgb, var(--color-amber) 15%, var(--color-elevated))',
                  border:
                    '1px solid color-mix(in srgb, var(--color-amber) 40%, transparent)',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  color: 'var(--color-amber)',
                  fontWeight: 500,
                  cursor: 'grab',
                  maxWidth: 90,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={col}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Texto explicativo */}
          <p
            style={{
              marginTop: 12,
              fontSize: 11,
              color: 'var(--color-text-3)',
              lineHeight: 1.5,
            }}
          >
            Dentro de "Para cada linha..." volta usa uma linha:{' '}
            <code style={{ fontSize: 11 }}>linha.login</code> é um valor
            diferente a cada repetição.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function FlowsPage() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <BlocosPanel />
      <CanvasPanel />
      <PropriedadesPanel />
    </div>
  );
}
