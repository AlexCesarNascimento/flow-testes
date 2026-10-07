import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react';
import { useActionStore } from '@/entities/action';
import {
  getBlockDefinition,
  type BlockCategory,
  type BlockKind,
} from './catalog';

export type BlockNodeData = {
  label: string;
  category: BlockCategory;
  type: string;
  kind: BlockKind;
  sources: string[];
  hasTarget: boolean;
  isContainer: boolean;
};

export type FlowNode = Node<BlockNodeData, 'block'>;
export type FlowEdge = Edge;

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export type LogEntry = {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  nodeId?: string;
  nodeLabel?: string;
};

const MAX_LOG_ENTRIES = 200;

const DEFAULT_SIZE: Record<BlockKind, { width: number; height: number }> = {
  atomic: { width: 180, height: 56 },
  action: { width: 220, height: 72 },
  condition: { width: 360, height: 240 },
  loop: { width: 320, height: 220 },
  terminal: { width: 120, height: 48 },
};

type FlowStore = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedId: string | null;
  isPlaying: boolean;
  currentNodeId: string | null;
  logs: LogEntry[];
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  /** Posição é absoluta se `parentId` ausente, local (relativa ao pai) caso contrário. */
  addBlock: (
    type: string,
    position: XYPosition,
    parentId?: string,
  ) => FlowNode | null;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  log: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
};

const PLAY_STEP_MS = 800;
let playTimeout: ReturnType<typeof setTimeout> | null = null;

function clearPlayTimeout() {
  if (playTimeout) {
    clearTimeout(playTimeout);
    playTimeout = null;
  }
}

function resolveLabel(type: string, fallback: string): string {
  if (!type.startsWith('action:')) return fallback;
  const id = type.slice('action:'.length);
  const action = useActionStore.getState().actions.find((a) => a.id === id);
  return action?.name ?? 'Ação sem nome';
}

export const useFlowStore = create<FlowStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedId: null,
      isPlaying: false,
      currentNodeId: null,
      logs: [],
      onNodesChange: (changes) =>
        set({ nodes: applyNodeChanges(changes, get().nodes) as FlowNode[] }),
      onEdgesChange: (changes) =>
        set({ edges: applyEdgeChanges(changes, get().edges) }),
      onConnect: (connection) =>
        set({
          edges: addEdge({ ...connection, animated: false }, get().edges),
        }),
      addBlock: (type, position, parentId) => {
        const def = getBlockDefinition(type);
        if (!def) return null;
        const size = DEFAULT_SIZE[def.kind];
        const label = resolveLabel(type, def.label);
        const node: FlowNode = {
          id: `blk_${crypto.randomUUID()}`,
          type: 'block',
          position,
          data: {
            label,
            category: def.category,
            type: def.type,
            kind: def.kind,
            sources: def.sources,
            hasTarget: def.hasTarget,
            isContainer: def.isContainer,
          },
          style: { width: size.width, height: size.height },
          ...(parentId
            ? { parentId, extent: 'parent' as const, expandParent: true }
            : {}),
        };
        // Containers precisam vir antes dos filhos; filhos sempre são
        // inseridos ao fim (containers são adicionados primeiro no fluxo).
        set({ nodes: [...get().nodes, node] });
        return node;
      },
      removeNode: (id) =>
        set((s) => {
          const removeIds = new Set<string>([id]);
          // Remove filhos recursivamente.
          let changed = true;
          while (changed) {
            changed = false;
            for (const n of s.nodes) {
              if (
                n.parentId &&
                removeIds.has(n.parentId) &&
                !removeIds.has(n.id)
              ) {
                removeIds.add(n.id);
                changed = true;
              }
            }
          }
          return {
            nodes: s.nodes.filter((n) => !removeIds.has(n.id)),
            edges: s.edges.filter(
              (e) => !removeIds.has(e.source) && !removeIds.has(e.target),
            ),
            selectedId: removeIds.has(s.selectedId ?? '') ? null : s.selectedId,
          };
        }),
      selectNode: (id) => set({ selectedId: id }),
      startPlayback: () => {
        clearPlayTimeout();
        const { nodes, edges, log, clearLogs } = get();
        if (nodes.length === 0) {
          log({ level: 'warn', message: 'Fluxo vazio — nada para executar.' });
          return;
        }
        clearLogs();
        // Nó inicial = primeiro sem aresta de entrada; fallback = primeiro nó.
        const targets = new Set(edges.map((e) => e.target));
        const start = nodes.find((n) => !targets.has(n.id)) ?? nodes[0];
        log({
          level: 'info',
          message: `Iniciando simulação a partir de "${start.data.label}".`,
          nodeId: start.id,
          nodeLabel: start.data.label,
        });
        log({
          level: 'info',
          message: `Executando: ${start.data.label} (${start.data.type}).`,
          nodeId: start.id,
          nodeLabel: start.data.label,
        });
        set({ isPlaying: true, currentNodeId: start.id });
        scheduleNext(start.id, new Set([start.id]));
      },
      stopPlayback: () => {
        clearPlayTimeout();
        const { isPlaying, log } = get();
        if (isPlaying) {
          log({
            level: 'info',
            message: 'Simulação interrompida pelo usuário.',
          });
        }
        set({ isPlaying: false, currentNodeId: null });
      },
      log: (entry) =>
        set((s) => {
          const next: LogEntry = {
            id: `log_${crypto.randomUUID()}`,
            timestamp: Date.now(),
            ...entry,
          };
          const logs = [...s.logs, next];
          if (logs.length > MAX_LOG_ENTRIES) {
            logs.splice(0, logs.length - MAX_LOG_ENTRIES);
          }
          return { logs };
        }),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'flowtest.flow.v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ nodes: s.nodes, edges: s.edges }),
    },
  ),
);

function scheduleNext(fromId: string, visited: Set<string>) {
  playTimeout = setTimeout(() => {
    const state = useFlowStore.getState();
    if (!state.isPlaying) return;
    const { nodes, edges, log } = state;
    const node = nodes.find((n) => n.id === fromId);
    if (!node) {
      log({ level: 'error', message: `Nó ${fromId} não encontrado.` });
      finishPlayback('error');
      return;
    }
    // Terminal explícito (ex.: Parar).
    if (node.data.kind === 'terminal') {
      log({
        level: 'warn',
        message: `Fluxo interrompido no bloco "${node.data.label}".`,
        nodeId: node.id,
        nodeLabel: node.data.label,
      });
      finishPlayback('warn');
      return;
    }
    const sourceOrder = node.data.sources;
    let nextId: string | null = null;
    let viaHandle: string | undefined;
    for (const sh of sourceOrder) {
      const edge = edges.find(
        (e) => e.source === fromId && e.sourceHandle === sh,
      );
      if (edge) {
        nextId = edge.target;
        viaHandle = sh;
        break;
      }
    }
    if (!nextId) {
      const anyEdge = edges.find((e) => e.source === fromId);
      nextId = anyEdge?.target ?? null;
      viaHandle = anyEdge?.sourceHandle ?? undefined;
    }
    if (!nextId) {
      if (sourceOrder.length > 0) {
        log({
          level: 'error',
          message: `Bloco "${node.data.label}" sem saída conectada — fluxo parado.`,
          nodeId: node.id,
          nodeLabel: node.data.label,
        });
        finishPlayback('error');
      } else {
        log({
          level: 'success',
          message: 'Fluxo concluído.',
        });
        finishPlayback('success');
      }
      return;
    }
    if (visited.has(nextId)) {
      log({
        level: 'warn',
        message: `Ciclo detectado — já visitado "${nodes.find((n) => n.id === nextId)?.data.label ?? nextId}".`,
      });
      finishPlayback('warn');
      return;
    }
    visited.add(nextId);
    const nextNode = nodes.find((n) => n.id === nextId);
    if (nextNode) {
      log({
        level: 'info',
        message:
          viaHandle && viaHandle !== 'next'
            ? `→ via ${viaHandle} para "${nextNode.data.label}" (${nextNode.data.type}).`
            : `Executando: ${nextNode.data.label} (${nextNode.data.type}).`,
        nodeId: nextNode.id,
        nodeLabel: nextNode.data.label,
      });
    }
    useFlowStore.setState({ currentNodeId: nextId });
    scheduleNext(nextId, visited);
  }, PLAY_STEP_MS);
}

function finishPlayback(result: 'success' | 'warn' | 'error') {
  playTimeout = setTimeout(() => {
    clearPlayTimeout();
    const { log } = useFlowStore.getState();
    if (result === 'success') {
      log({ level: 'success', message: 'Simulação finalizada com sucesso.' });
    } else if (result === 'warn') {
      log({ level: 'warn', message: 'Simulação finalizada com avisos.' });
    } else {
      log({ level: 'error', message: 'Simulação finalizada com erro.' });
    }
    useFlowStore.setState({ isPlaying: false, currentNodeId: null });
  }, PLAY_STEP_MS);
}
