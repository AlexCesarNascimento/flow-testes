import { useCallback, useMemo, type DragEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type XYPosition,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore, type FlowNode } from '@/entities/flow';
import { BlockNode } from './BlockNode';
import { MiniDevicePreview } from './MiniDevicePreview';

export const PALETTE_MIME = 'application/x-flowtest-block-new';

type PalettePayload = { type: string };

function readPalette(e: DragEvent): PalettePayload | null {
  const raw = e.dataTransfer.getData(PALETTE_MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PalettePayload;
  } catch {
    return null;
  }
}

function findContainerAt(nodes: FlowNode[], pos: XYPosition): FlowNode | null {
  // Procura do mais recente para o mais antigo — favorece containers aninhados
  // que foram criados por último (ficam "em cima").
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const n = nodes[i];
    if (!n.data.isContainer) continue;
    const nx = n.position.x ?? 0;
    const ny = n.position.y ?? 0;
    const nw =
      (n.width as number | undefined) ??
      (n.measured?.width as number | undefined) ??
      (n.style?.width as number | undefined) ??
      0;
    const nh =
      (n.height as number | undefined) ??
      (n.measured?.height as number | undefined) ??
      (n.style?.height as number | undefined) ??
      0;
    if (!nw || !nh) continue;
    // Converte coordenada do nó para posição absoluta somando pais.
    const abs = toAbsolutePosition(nodes, n);
    if (
      pos.x >= abs.x &&
      pos.x <= abs.x + nw &&
      pos.y >= abs.y &&
      pos.y <= abs.y + nh
    ) {
      return n;
    }
  }
  return null;
}

function toAbsolutePosition(nodes: FlowNode[], node: FlowNode): XYPosition {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodes.find((p) => p.id === parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

function sortParentsFirst(nodes: FlowNode[]): FlowNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = (n: FlowNode): number => {
    let d = 0;
    let cur: FlowNode | undefined = n;
    while (cur?.parentId) {
      cur = byId.get(cur.parentId);
      d += 1;
      if (d > 50) break;
    }
    return d;
  };
  return [...nodes].sort((a, b) => depth(a) - depth(b));
}

function FlowCanvasInner() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addBlock = useFlowStore((s) => s.addBlock);
  const selectNode = useFlowStore((s) => s.selectNode);
  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes = useMemo(() => ({ block: BlockNode }), []);
  const sortedNodes = useMemo(() => sortParentsFirst(nodes), [nodes]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const payload = readPalette(e);
      if (!payload) return;
      const absolute = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const currentNodes = useFlowStore.getState().nodes;
      const container = findContainerAt(currentNodes, absolute);
      if (container) {
        const parentAbs = toAbsolutePosition(currentNodes, container);
        const local = {
          x: absolute.x - parentAbs.x,
          y: absolute.y - parentAbs.y,
        };
        addBlock(payload.type, local, container.id);
      } else {
        addBlock(payload.type, absolute);
      }
    },
    [addBlock, screenToFlowPosition],
  );

  return (
    <div
      className="flow-canvas"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={sortedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ animated: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <MiniDevicePreview />
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
