export type ElementKind =
  | 'input'
  | 'button'
  | 'toggle'
  | 'checkbox'
  | 'radio'
  | 'link'
  | 'image'
  | 'list-item'
  | 'text'
  | 'container';

export type UiElement = {
  className: string;
  resourceId: string;
  text: string;
  contentDesc: string;
  packageName: string;
  bounds: [number, number, number, number];
  clickable: boolean;
  enabled: boolean;
  focusable: boolean;
  focused: boolean;
  editable: boolean;
  kind: ElementKind;
};

export function classifyElement(
  className: string,
  clickable: boolean,
): ElementKind {
  const c = className.toLowerCase();
  if (c.includes('edittext') || c.includes('autocompletetextview'))
    return 'input';
  if (c.includes('switch')) return 'toggle';
  if (c.includes('checkbox')) return 'checkbox';
  if (c.includes('radiobutton')) return 'radio';
  if (c.includes('button')) return 'button';
  if (c.includes('imageview') || c.includes('imagebutton')) {
    return clickable ? 'button' : 'image';
  }
  if (
    c.includes('listitem') ||
    c.includes('recyclerview') ||
    c.endsWith('.item')
  ) {
    return 'list-item';
  }
  if (c.includes('textview')) return clickable ? 'link' : 'text';
  return clickable ? 'button' : 'container';
}

export function parseUiDump(raw: string): UiElement[] {
  const xmlStart = raw.indexOf('<?xml');
  const xml = xmlStart >= 0 ? raw.slice(xmlStart) : raw;

  const elements: UiElement[] = [];
  const nodeRegex = /<node\b([^>]*)>/g;
  let match: RegExpExecArray | null;

  while ((match = nodeRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const bounds = parseBounds(getAttr(attrs, 'bounds'));
    if (!bounds) continue;

    const className = getAttr(attrs, 'class');
    const clickable = getAttr(attrs, 'clickable') === 'true';
    elements.push({
      className,
      resourceId: getAttr(attrs, 'resource-id'),
      text: getAttr(attrs, 'text'),
      contentDesc: getAttr(attrs, 'content-desc'),
      packageName: getAttr(attrs, 'package'),
      bounds,
      clickable,
      enabled: getAttr(attrs, 'enabled') !== 'false',
      focusable: getAttr(attrs, 'focusable') === 'true',
      focused: getAttr(attrs, 'focused') === 'true',
      editable:
        className.includes('EditText') ||
        className.includes('AutoCompleteTextView'),
      kind: classifyElement(className, clickable),
    });
  }

  return elements;
}

function getAttr(attrs: string, name: string): string {
  const m = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m
    ? m[1].replace(
        /&(?:quot|apos|lt|gt|amp);/g,
        (entity) =>
          ({
            '&quot;': '"',
            '&apos;': "'",
            '&lt;': '<',
            '&gt;': '>',
            '&amp;': '&',
          })[entity] ?? entity,
      )
    : '';
}

function parseBounds(s: string): [number, number, number, number] | null {
  const m = s.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return null;
  return [+m[1], +m[2], +m[3], +m[4]];
}

/**
 * Seleciona o melhor elemento contendo (x, y). Prioriza:
 *   1. editáveis (para capturar entrada de texto)
 *   2. clicáveis
 *   3. elementos com identidade forte (resource-id, content-desc, text)
 *   4. menor área (mais específico)
 */
export function findElementAt(
  elements: UiElement[],
  x: number,
  y: number,
): UiElement | null {
  const candidates = elements.filter((el) => {
    const [l, t, r, b] = el.bounds;
    return x >= l && x <= r && y >= t && y <= b;
  });
  if (candidates.length === 0) return null;

  const score = (el: UiElement): number => {
    const [l, t, r, b] = el.bounds;
    const area = Math.max((r - l) * (b - t), 1);
    let s = -area; // menor área ganha
    if (el.editable) s += 5e8;
    if (el.clickable) s += 1e8;
    if (el.resourceId) s += 1e7;
    if (el.contentDesc) s += 5e6;
    if (el.text) s += 2e6;
    return s;
  };

  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0];
}

export class UiTargetError extends Error {
  code: 'missing' | 'ambiguous' | 'unidentified';
  constructor(code: 'missing' | 'ambiguous' | 'unidentified', message: string) {
    super(message);
    this.code = code;
  }
}

/** Combina as identidades no mesmo node; nunca desempata por posição da tela. */
export function resolveUiElement(
  elements: UiElement[],
  selectors: { type: string; value: string }[],
): UiElement {
  const identity = selectors.filter((s) =>
    ['resourceId', 'accessibilityId', 'text'].includes(s.type),
  );
  if (!identity.length)
    throw new UiTargetError(
      'unidentified',
      'Elemento não identificado. Grave novamente o toque; coordenadas não são usadas no play.',
    );
  const matches = elements.filter((el) => {
    const [l, t, r, b] = el.bounds;
    return (
      r > l &&
      b > t &&
      identity.every((s) => {
        const value =
          s.type === 'resourceId'
            ? el.resourceId
            : s.type === 'accessibilityId'
              ? el.contentDesc
              : el.text;
        return value.trim() === s.value.trim();
      })
    );
  });
  if (matches.length === 0)
    throw new UiTargetError(
      'missing',
      'Elemento não encontrado na tela atual pela combinação de seletores.',
    );
  if (matches.length > 1)
    throw new UiTargetError(
      'ambiguous',
      'Seletor ambíguo: mais de um elemento corresponde. Grave novamente com texto ou accessibility-id.',
    );
  return matches[0];
}
