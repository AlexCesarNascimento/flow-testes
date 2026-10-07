import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Trash2, GitBranch, RotateCw, StopCircle, Package } from 'lucide-react';
import { useFlowStore, type FlowNode } from '@/entities/flow';

function handleLeftPercent(count: number, index: number): number {
  if (count <= 1) return 50;
  return (100 / (count + 1)) * (index + 1);
}

function RemoveButton({ id, label }: { id: string; label: string }) {
  const removeNode = useFlowStore((s) => s.removeNode);
  return (
    <button
      type="button"
      className="block-node__remove"
      aria-label={`Remover ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        removeNode(id);
      }}
    >
      <Trash2 size={11} aria-hidden="true" />
    </button>
  );
}

function SourceHandles({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  return (
    <>
      {sources.length > 1 && (
        <div className="block-node__source-labels">
          {sources.map((srcId, index) => (
            <span
              key={srcId}
              className="block-node__source-label"
              style={{ left: `${handleLeftPercent(sources.length, index)}%` }}
            >
              {srcId}
            </span>
          ))}
        </div>
      )}
      {sources.map((srcId, index) => (
        <Handle
          key={srcId}
          id={srcId}
          type="source"
          position={Position.Bottom}
          className="block-node__handle block-node__handle--out"
          style={{ left: `${handleLeftPercent(sources.length, index)}%` }}
        />
      ))}
    </>
  );
}

function BlockNodeComponent({ id, data, selected }: NodeProps<FlowNode>) {
  const isPlaying = useFlowStore((s) => s.currentNodeId === id);
  const className =
    `block-node block-node--${data.kind}` +
    (selected ? ' block-node--selected' : '') +
    (isPlaying ? ' block-node--playing' : '');

  if (data.kind === 'action') {
    return (
      <div className={className} data-category={data.category}>
        <Handle
          type="target"
          position={Position.Top}
          className="block-node__handle block-node__handle--in"
        />
        <div className="block-node__header">
          <Package size={13} aria-hidden="true" />
          <span className="block-node__badge">Ação</span>
          <RemoveButton id={id} label={data.label} />
        </div>
        <div className="block-node__action-name">{data.label}</div>
        <SourceHandles sources={data.sources} />
      </div>
    );
  }

  if (data.kind === 'condition') {
    return (
      <div className={className} data-category={data.category}>
        <Handle
          type="target"
          position={Position.Top}
          className="block-node__handle block-node__handle--in"
        />
        <div className="block-node__header">
          <GitBranch size={13} aria-hidden="true" />
          <span className="block-node__label">{data.label}</span>
          <RemoveButton id={id} label={data.label} />
        </div>
        <div className="block-node__body-split">
          <div className="block-node__body-col">
            <span className="block-node__body-tag">THEN</span>
            <div className="block-node__drop-hint">Solte blocos aqui</div>
          </div>
          <div className="block-node__body-divider" aria-hidden="true" />
          <div className="block-node__body-col">
            <span className="block-node__body-tag">ELSE</span>
            <div className="block-node__drop-hint">Solte blocos aqui</div>
          </div>
        </div>
        <SourceHandles sources={data.sources} />
      </div>
    );
  }

  if (data.kind === 'loop') {
    return (
      <div className={className} data-category={data.category}>
        <Handle
          type="target"
          position={Position.Top}
          className="block-node__handle block-node__handle--in"
        />
        <div className="block-node__header">
          <RotateCw size={13} aria-hidden="true" />
          <span className="block-node__label">{data.label}</span>
          <RemoveButton id={id} label={data.label} />
        </div>
        <div className="block-node__body-single">
          <span className="block-node__body-tag">BODY</span>
          <div className="block-node__drop-hint">Solte blocos aqui</div>
        </div>
        <SourceHandles sources={data.sources} />
      </div>
    );
  }

  if (data.kind === 'terminal') {
    return (
      <div className={className} data-category={data.category}>
        <Handle
          type="target"
          position={Position.Top}
          className="block-node__handle block-node__handle--in"
        />
        <div className="block-node__header block-node__header--terminal">
          <StopCircle size={13} aria-hidden="true" />
          <span className="block-node__label">{data.label}</span>
          <RemoveButton id={id} label={data.label} />
        </div>
      </div>
    );
  }

  return (
    <div className={className} data-category={data.category}>
      {data.hasTarget && (
        <Handle
          type="target"
          position={Position.Top}
          className="block-node__handle block-node__handle--in"
        />
      )}
      <div className="block-node__header">
        <span
          className="block-node__dot"
          data-category={data.category}
          aria-hidden="true"
        />
        <span className="block-node__label">{data.label}</span>
        <RemoveButton id={id} label={data.label} />
      </div>
      <SourceHandles sources={data.sources} />
    </div>
  );
}

export const BlockNode = memo(BlockNodeComponent);
