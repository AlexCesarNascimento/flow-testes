export type BlockCategory =
  'device' | 'interacao' | 'validacao' | 'controle' | 'acoes';

export type BlockKind = 'atomic' | 'action' | 'condition' | 'loop' | 'terminal';

export type BlockDefinition = {
  type: string;
  label: string;
  category: BlockCategory;
  kind: BlockKind;
  /** IDs das handles de saída. `[]` significa nó terminal (sem saída). */
  sources: string[];
  /** Se o nó aceita entrada (handle no topo). */
  hasTarget: boolean;
  /** Container: aceita filhos via parentId e cresce com eles. */
  isContainer: boolean;
};

const atomic = (
  type: string,
  label: string,
  category: BlockCategory,
): BlockDefinition => ({
  type,
  label,
  category,
  kind: 'atomic',
  sources: ['next'],
  hasTarget: true,
  isContainer: false,
});

export const BLOCK_CATALOG: BlockDefinition[] = [
  atomic('open-app', 'Abrir app', 'device'),
  atomic('close-app', 'Fechar app', 'device'),
  atomic('restart-app', 'Reiniciar app', 'device'),
  atomic('screenshot', 'Screenshot', 'device'),
  atomic('back', 'Voltar', 'device'),
  atomic('home', 'Home', 'device'),
  atomic('rotate', 'Rotacionar', 'device'),
  atomic('shake', 'Shake', 'device'),

  atomic('tap', 'Tap', 'interacao'),
  atomic('long-press', 'Long press', 'interacao'),
  atomic('type-text', 'Digitar', 'interacao'),
  atomic('swipe', 'Swipe', 'interacao'),
  atomic('scroll', 'Scroll', 'interacao'),
  atomic('key-event', 'Key event', 'interacao'),

  atomic('verify-text', 'Verificar texto', 'validacao'),
  atomic('verify-element', 'Verificar elemento', 'validacao'),
  atomic('verify-absence', 'Verificar ausência', 'validacao'),

  {
    type: 'repeat-n',
    label: 'Repetir N vezes',
    category: 'controle',
    kind: 'loop',
    sources: ['body', 'done'],
    hasTarget: true,
    isContainer: true,
  },
  {
    type: 'for-each-row',
    label: 'Para cada linha',
    category: 'controle',
    kind: 'loop',
    sources: ['body', 'done'],
    hasTarget: true,
    isContainer: true,
  },
  {
    type: 'if-else',
    label: 'Se / Senão',
    category: 'controle',
    kind: 'condition',
    sources: ['then', 'else'],
    hasTarget: true,
    isContainer: true,
  },
  atomic('wait', 'Aguardar', 'controle'),
  {
    type: 'stop',
    label: 'Parar',
    category: 'controle',
    kind: 'terminal',
    sources: [],
    hasTarget: true,
    isContainer: false,
  },
  atomic('comment', 'Comentário', 'controle'),
];

const CATALOG_BY_TYPE = new Map(BLOCK_CATALOG.map((b) => [b.type, b]));

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  if (type.startsWith('action:')) {
    return {
      type,
      label: 'Ação',
      category: 'acoes',
      kind: 'action',
      sources: ['next'],
      hasTarget: true,
      isContainer: false,
    };
  }
  return CATALOG_BY_TYPE.get(type);
}
