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
import { useRecorderStore } from '@/entities/recorder';
import { useAmbienteStore } from '@/entities/ambiente';
import { MOCK_DATASET_ROWS } from '@/entities/dataset';
import './flows-page.scss';

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

const SECTION_BLOCK_COLOR: Record<string, string> = {
  device: '#3b82f6',
  interacao: '#7c3aed',
  validacao: '#0ea5e9',
  controle: '#d97706',
};

function BlocosPanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(BLOCK_SECTIONS.map((s) => [s.id, s.defaultOpen])),
  );

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="blocos-panel">
      <div className="blocos-panel__header">
        <div className="blocos-panel__title">Blocos</div>
        <div className="blocos-panel__search">
          <Search size={12} className="blocos-panel__search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar bloco ou Action"
            className="blocos-panel__search-input"
          />
        </div>
      </div>

      <div className="blocos-panel__body">
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
            <div key={section.id} className="blocos-panel__section">
              <button
                onClick={() => toggleSection(section.id)}
                className="blocos-panel__section-header"
              >
                <span
                  className="blocos-panel__section-dot"
                  style={{ ['--section-color' as string]: section.color }}
                />
                <span className="blocos-panel__section-label">
                  {section.label}
                </span>
                <span className="blocos-panel__section-count">
                  {section.count}
                </span>
                {isOpen ? (
                  <ChevronUp size={12} className="blocos-panel__chevron" />
                ) : (
                  <ChevronDown size={12} className="blocos-panel__chevron" />
                )}
              </button>

              {isOpen && (
                <div className="blocos-panel__section-body">
                  {section.id === 'acoes' && section.blocks.length === 0 ? (
                    <>
                      <p className="blocos-panel__empty-msg">
                        {section.emptyMsg}
                      </p>
                      <button
                        onClick={() => navigate('/recorder')}
                        className="blocos-panel__record-btn"
                      >
                        <span className="blocos-panel__record-dot">●</span>
                        Gravar uma Action
                      </button>
                    </>
                  ) : (
                    <div className="blocos-panel__blocks">
                      {filteredBlocks.map((block) => (
                        <div
                          key={block}
                          draggable
                          className="blocos-panel__block"
                          style={{
                            ['--block-color' as string]:
                              SECTION_BLOCK_COLOR[section.id] ??
                              'var(--color-elevated)',
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

function CanvasPanel() {
  const { recorderTitle } = useRecorderStore();

  return (
    <div className="canvas-panel">
      <div className="canvas-panel__toolbar">
        <div className="canvas-panel__title-row">
          <span className="canvas-panel__flow-title">{recorderTitle}</span>
          <button className="canvas-panel__edit-btn">
            <Pencil size={13} />
          </button>
        </div>
        <button className="canvas-panel__example-btn">
          <Table2 size={13} />
          Exemplo: várias contas
        </button>
        {[
          { Icon: Undo2, label: 'Desfazer' },
          { Icon: Redo2, label: 'Refazer' },
          { Icon: Trash2, label: 'Limpar' },
        ].map(({ Icon, label }) => (
          <button key={label} title={label} className="canvas-panel__icon-btn">
            <Icon size={13} />
          </button>
        ))}
      </div>

      <div className="canvas-panel__area">
        <div className="canvas-panel__blocks">
          <div className="scratch-block scratch-block--green">
            <span className="scratch-block__icon">
              <svg width="8" height="10" viewBox="0 0 8 10" fill="white">
                <path d="M0 0l8 5-8 5V0z" />
              </svg>
            </span>
            <span className="scratch-block__label">quando</span>
            <span className="scratch-block__value">Executar o Flow</span>
          </div>

          <div className="scratch-block scratch-block--blue scratch-block--indent">
            <span className="scratch-block__label">abrir app</span>
            <span className="scratch-block__value-mono">
              com.exemplo.app.hml
            </span>
          </div>

          <div className="scratch-block scratch-block--green scratch-block--indent">
            <span className="scratch-block__label">esperar texto</span>
            <span className="scratch-block__dropdown">
              Olá, Alex
              <ChevronDown
                size={12}
                className="scratch-block__dropdown-chevron"
              />
            </span>
            <span className="scratch-block__label">aparecer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropriedadesPanel() {
  const datasetRows = MOCK_DATASET_ROWS;
  const { ambientes } = useAmbienteStore();
  void ambientes;

  const datasetColumns = [
    'linha.id',
    'linha.login',
    'linha.saudacao',
    'linha.senha',
    'linha.tipo',
  ];

  return (
    <div className="propriedades-panel">
      <div className="propriedades-panel__header">Propriedades</div>

      <div className="propriedades-panel__body">
        <p className="propriedades-panel__desc">
          Clique em um bloco para ver seus campos.{' '}
          <span className="propriedades-panel__highlight">brancos</span> aceitam
          um valor fixo ou uma coluna do dataset. Arraste a peça laranja para
          dentro do campo.
        </p>

        <div className="propriedades-panel__section">
          <div className="propriedades-panel__section-title">
            VARIÁVEIS DO FLOW
          </div>
          <div className="propriedades-panel__empty-box">
            Nenhuma variável ainda — arraste a peça laranja para um campo branco
            de qualquer bloco.
          </div>
        </div>

        <div className="propriedades-panel__section">
          <div className="propriedades-panel__section-title">
            COLUNAS DO DATASET
          </div>
          <div className="propriedades-panel__dataset-name">
            clientes_varejo · {datasetRows.length} linhas
          </div>
          <div className="propriedades-panel__columns">
            {datasetColumns.map((col) => (
              <span
                key={col}
                draggable
                className="propriedades-panel__column-chip"
                title={col}
              >
                {col}
              </span>
            ))}
          </div>
          <p className="propriedades-panel__note">
            Dentro de "Para cada linha..." volta usa uma linha:{' '}
            <code className="propriedades-panel__inline-code">linha.login</code>{' '}
            é um valor diferente a cada repetição.
          </p>
        </div>
      </div>
    </div>
  );
}

export function FlowsPage() {
  return (
    <div className="flows-page">
      <BlocosPanel />
      <CanvasPanel />
      <PropriedadesPanel />
    </div>
  );
}
