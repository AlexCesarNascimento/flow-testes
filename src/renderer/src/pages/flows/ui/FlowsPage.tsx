import { useMemo, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, Play, Square } from 'lucide-react';
import { useActionStore, type SavedAction } from '@/entities/action';
import {
  BLOCK_CATALOG,
  useFlowStore,
  type BlockCategory,
  type BlockDefinition,
} from '@/entities/flow';
import { useLayoutStore } from '@/widgets/app-shell/model/layout-store';
import { FlowCanvas, PALETTE_MIME } from './FlowCanvas';
import { TrackingPanel } from './TrackingPanel';
import './flows-page.scss';

type PalettePayload = { type: string };

type PaletteSection = {
  id: BlockCategory;
  label: string;
  defaultOpen: boolean;
  emptyMsg?: string;
};

const SECTIONS: PaletteSection[] = [
  {
    id: 'acoes',
    label: 'MINHAS AÇÕES',
    defaultOpen: true,
    emptyMsg:
      'Nenhuma Action ainda. Grave um fluxo e salve como Action para encaixar aqui.',
  },
  { id: 'device', label: 'APP / DEVICE', defaultOpen: false },
  { id: 'interacao', label: 'INTERAÇÃO', defaultOpen: true },
  { id: 'validacao', label: 'VALIDAÇÃO', defaultOpen: false },
  { id: 'controle', label: 'CONTROLE', defaultOpen: true },
];

function setPalettePayload(e: DragEvent, payload: PalettePayload) {
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData(PALETTE_MIME, JSON.stringify(payload));
}

function PaletteBlock({ block }: { block: BlockDefinition }) {
  return (
    <div
      draggable
      className="blocos-panel__block"
      data-section={block.category}
      onDragStart={(e) => setPalettePayload(e, { type: block.type })}
    >
      {block.label}
    </div>
  );
}

function PaletteAction({ action }: { action: SavedAction }) {
  return (
    <div
      draggable
      className="blocos-panel__saved-block"
      onDragStart={(e) => setPalettePayload(e, { type: `action:${action.id}` })}
    >
      <strong>{action.name}</strong>
      <span>
        {action.folder} · {action.steps.length}{' '}
        {action.steps.length === 1 ? 'step' : 'steps'} · bloco encapsulado
      </span>
    </div>
  );
}

function BlocosPanel() {
  const actions = useActionStore((s) => s.actions);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SECTIONS.map((s) => [s.id, s.defaultOpen])),
  );

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const query = search.trim().toLowerCase();
  const blocksByCategory = useMemo(() => {
    const map = new Map<BlockCategory, BlockDefinition[]>();
    for (const b of BLOCK_CATALOG) {
      if (!map.has(b.category)) map.set(b.category, []);
      map.get(b.category)!.push(b);
    }
    return map;
  }, []);

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
            aria-label="Buscar bloco ou Action"
            className="blocos-panel__search-input"
          />
        </div>
      </div>

      <div className="blocos-panel__body">
        {SECTIONS.map((section) => {
          const isOpen = openSections[section.id];
          const sectionBlocks = blocksByCategory.get(section.id) ?? [];
          const filteredBlocks = sectionBlocks.filter((b) =>
            b.label.toLowerCase().includes(query),
          );
          const filteredActions =
            section.id === 'acoes'
              ? actions.filter((a) =>
                  `${a.name} ${a.folder}`.toLowerCase().includes(query),
                )
              : [];
          const count =
            section.id === 'acoes' ? actions.length : sectionBlocks.length;
          const hasResults =
            section.id === 'acoes'
              ? filteredActions.length > 0
              : filteredBlocks.length > 0;
          if (query && !hasResults) return null;

          return (
            <div key={section.id} className="blocos-panel__section">
              <button
                onClick={() => toggleSection(section.id)}
                className="blocos-panel__section-header"
              >
                <span
                  className="blocos-panel__section-dot"
                  data-section={section.id}
                />
                <span className="blocos-panel__section-label">
                  {section.label}
                </span>
                <span className="blocos-panel__section-count">{count}</span>
                {isOpen ? (
                  <ChevronUp size={12} className="blocos-panel__chevron" />
                ) : (
                  <ChevronDown size={12} className="blocos-panel__chevron" />
                )}
              </button>

              {isOpen && (
                <div className="blocos-panel__section-body">
                  {section.id === 'acoes' ? (
                    actions.length > 0 ? (
                      <div className="blocos-panel__blocks">
                        {filteredActions.map((action) => (
                          <PaletteAction key={action.id} action={action} />
                        ))}
                      </div>
                    ) : (
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
                    )
                  ) : (
                    <div className="blocos-panel__blocks">
                      {filteredBlocks.map((block) => (
                        <PaletteBlock key={block.type} block={block} />
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
  const isPlaying = useFlowStore((s) => s.isPlaying);
  const nodeCount = useFlowStore((s) => s.nodes.length);
  const startPlayback = useFlowStore((s) => s.startPlayback);
  const stopPlayback = useFlowStore((s) => s.stopPlayback);
  return (
    <div className="canvas-panel">
      <div className="canvas-panel__toolbar">
        <strong>Fluxo</strong>
        <button
          type="button"
          className={`canvas-panel__play-btn${isPlaying ? ' canvas-panel__play-btn--active' : ''}`}
          onClick={isPlaying ? stopPlayback : startPlayback}
          disabled={!isPlaying && nodeCount === 0}
          aria-label={isPlaying ? 'Parar simulação' : 'Rodar fluxo'}
        >
          {isPlaying ? (
            <>
              <Square size={12} aria-hidden="true" />
              Parar
            </>
          ) : (
            <>
              <Play size={12} aria-hidden="true" />
              Play
            </>
          )}
        </button>
        <span className="canvas-panel__saved-badge">
          Salvo neste computador
        </span>
      </div>
      <div className="canvas-panel__area">
        <FlowCanvas />
      </div>
    </div>
  );
}

export function FlowsPage() {
  const leftTrayCollapsed = useLayoutStore((s) => s.leftTrayCollapsed);
  const rightTrayCollapsed = useLayoutStore((s) => s.rightTrayCollapsed);
  return (
    <div className="flows-page">
      {!leftTrayCollapsed && <BlocosPanel />}
      <CanvasPanel />
      {!rightTrayCollapsed && <TrackingPanel />}
    </div>
  );
}
