# Flow canvas (MVP)

Editor central da aba `Flows` para montar o fluxo de teste arrastando blocos em um board 2D estilo draw.io.

## Objetivo do MVP

Permitir montar um fluxo arrastando blocos (passos atômicos, Ações salvas, loops e condicional) para um canvas livre, posicionando-os em (x, y) arbitrário e desenhando arestas entre portas de saída e entrada. Loops e condicional têm múltiplas saídas (ex.: `then`/`else`, `body`/`done`) representadas como handles nomeadas.

Fora do MVP: edição de parâmetros por bloco, undo/redo, validação de tipos entre blocos, binding de dataset por aresta, auto-layout.

## Modelo de dados

Nova entidade `flow` com store Zustand persistida em `localStorage` (chave `flowtest.flow.v2`). Usa o modelo nós+arestas do `@xyflow/react`.

```ts
type BlockCategory = 'device' | 'interacao' | 'validacao' | 'controle' | 'acoes';

type BlockNodeData = {
  label: string;                   // texto mostrado no cartão
  category: BlockCategory;
  type: string;                    // 'tap', 'if-else', 'repeat-n', 'action:<actionId>'
  sources: string[];               // IDs das handles de saída
  hasTarget: boolean;              // se aceita handle de entrada
};

type FlowNode = Node<BlockNodeData, 'block'>;
type FlowEdge = Edge;              // source, target, sourceHandle, targetHandle

type FlowStore = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedId: string | null;
  onNodesChange: (changes: NodeChange[]) => void;   // via applyNodeChanges
  onEdgesChange: (changes: EdgeChange[]) => void;   // via applyEdgeChanges
  onConnect: (connection: Connection) => void;      // via addEdge
  addBlock: (type: string, position: XYPosition) => FlowNode | null;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
};
```

## Catálogo de blocos

Cada bloco expõe `hasTarget` (handle de entrada no topo) e `sources` (handles de saída na base). Blocos com mais de uma saída rotulam cada handle (ex.: `then`/`else`).

| type              | category    | hasTarget | sources          |
| ----------------- | ----------- | --------- | ---------------- |
| open-app          | device      | sim       | `next`           |
| close-app         | device      | sim       | `next`           |
| restart-app       | device      | sim       | `next`           |
| screenshot        | device      | sim       | `next`           |
| back              | device      | sim       | `next`           |
| home              | device      | sim       | `next`           |
| rotate            | device      | sim       | `next`           |
| shake             | device      | sim       | `next`           |
| tap               | interacao   | sim       | `next`           |
| long-press        | interacao   | sim       | `next`           |
| type-text         | interacao   | sim       | `next`           |
| swipe             | interacao   | sim       | `next`           |
| scroll            | interacao   | sim       | `next`           |
| key-event         | interacao   | sim       | `next`           |
| verify-text       | validacao   | sim       | `next`           |
| verify-element    | validacao   | sim       | `next`           |
| verify-absence    | validacao   | sim       | `next`           |
| repeat-n          | controle    | sim       | `body`, `done`   |
| for-each-row      | controle    | sim       | `body`, `done`   |
| if-else           | controle    | sim       | `then`, `else`   |
| wait              | controle    | sim       | `next`           |
| stop              | controle    | sim       | — (terminal)     |
| comment           | controle    | sim       | `next`           |
| action:<id>       | acoes       | sim       | `next`           |

## Interação

- **Arrastar do painel esquerdo para o canvas**: dropa um nó no ponto do cursor, convertido para coordenadas de fluxo via `screenToFlowPosition`.
- **Mover nó**: drag nativo do React Flow.
- **Conectar nós**: arrastar de uma handle de saída para a handle de entrada do próximo nó. Linha pontilhada durante o drag.
- **Selecionar nó/aresta**: clique no board. O painel direito mostra `type`, `label`, `category` do nó.
- **Remover nó**: botão lixeira no cartão ou tecla Backspace/Delete padrão do React Flow (também remove arestas pendentes).

## UI

- `<ReactFlow>` com `<Background variant="dots">`, `<Controls>` (zoom in/out/fit) e `<MiniMap pannable zoomable>`.
- Nó custom `BlockNode`: cartão com faixa colorida à esquerda (cor por categoria), label, botão de remover; handles pintadas com a cor da categoria.
- Nós com múltiplas saídas (`if-else`, `repeat-n`, `for-each-row`) exibem rótulos pequenos acima das handles.
- Pan/zoom e snap vêm do React Flow.

## Arquivos

- `src/renderer/src/entities/flow/model/store.ts` — store Zustand usando `applyNodeChanges` / `applyEdgeChanges` / `addEdge`
- `src/renderer/src/entities/flow/model/catalog.ts` — catálogo com `sources` + `hasTarget`
- `src/renderer/src/entities/flow/index.ts` — public API
- `src/renderer/src/pages/flows/ui/FlowsPage.tsx` — painel esquerdo (palette), canvas, painel direito (propriedades)
- `src/renderer/src/pages/flows/ui/FlowCanvas.tsx` — `<ReactFlowProvider>` + canvas com drop handler
- `src/renderer/src/pages/flows/ui/BlockNode.tsx` — componente do nó custom
- `src/renderer/src/pages/flows/ui/flows-page.scss` — skin do React Flow nos tokens do FlowTest

## Fora de escopo (iterações seguintes)

- Edição de `params` por bloco (texto, seletores, variáveis bindadas)
- Validação de tipos entrada/saída entre blocos conectados
- Nó explícito de "Início" / "Fim"
- Auto-layout (`dagre` / `elk`)
- Undo/redo e atalhos de teclado além do padrão do React Flow
- Importar/exportar fluxo
