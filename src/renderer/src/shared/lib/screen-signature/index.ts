import type { UiElement } from '../ui-hierarchy/index.ts';

export type ScreenAnchor = {
  type: 'resourceId' | 'accessibilityId' | 'text';
  value: string;
};
export type ScreenSignature = {
  version: 1;
  packageName: string;
  anchors: ScreenAnchor[];
};

/** Nome de exibição; não participa da identidade da tela. */
export function screenDisplayName(screen: ScreenSignature): string {
  const useful = (value: string) =>
    /\p{L}/u.test(value) &&
    !/[\uE000-\uF8FF]/u.test(value) &&
    !/^(?:voltar|fechar|continuar|apagar tudo)$/i.test(value.trim());
  for (let index = 0; index < screen.anchors.length - 1; index++) {
    const anchor = screen.anchors[index];
    const next = screen.anchors[index + 1];
    if (
      anchor.type === 'resourceId' &&
      /(?:header|title)/i.test(anchor.value) &&
      next.type === 'text' &&
      useful(next.value)
    )
      return next.value;
  }
  return (
    screen.anchors.find(
      (anchor) => anchor.type === 'text' && useful(anchor.value),
    )?.value ??
    screen.anchors.find(
      (anchor) => anchor.type === 'accessibilityId' && useful(anchor.value),
    )?.value ??
    screen.anchors[0]?.value ??
    screen.packageName
  );
}

const key = (anchor: ScreenAnchor) =>
  JSON.stringify([anchor.type, anchor.value]);
const systemPackage =
  /^(android$|com\.android\.systemui$)|(?:inputmethod|keyboard)/i;

/** Coordenadas, foco e conteúdo digitado não participam da identidade. */
export function screenSignature(elements: UiElement[]): ScreenSignature | null {
  const root = elements.find(
    (el) => el.packageName && !systemPackage.test(el.packageName),
  );
  if (!root) return null;
  const anchors = new Map<string, ScreenAnchor>();
  for (const el of elements) {
    if (el.packageName !== root.packageName) continue;
    const [l, t, r, b] = el.bounds;
    if (r <= l || b <= t) continue;
    // Em telas nativas, o mesmo ID pode conter títulos diferentes.
    // Coletar atributos independentes do node, sem usar conteúdo de inputs.
    if (el.resourceId) {
      const anchor: ScreenAnchor = { type: 'resourceId', value: el.resourceId };
      anchors.set(key(anchor), anchor);
    }
    if (!el.editable && el.contentDesc?.trim() && !/\d/.test(el.contentDesc)) {
      const anchor: ScreenAnchor = {
        type: 'accessibilityId',
        value: el.contentDesc.trim(),
      };
      anchors.set(key(anchor), anchor);
    }
    if (!el.editable && el.text?.trim() && !/\d/.test(el.text)) {
      const anchor: ScreenAnchor = { type: 'text', value: el.text.trim() };
      anchors.set(key(anchor), anchor);
    }
  }
  if (!anchors.size) return null;
  return {
    version: 1,
    packageName: root.packageName,
    // Preserva a ordem do XML para usar o primeiro texto como nome da tela.
    // A comparação abaixo trata as âncoras como conjunto.
    anchors: [...anchors.values()],
  };
}

export function sameScreen(a: ScreenSignature, b: ScreenSignature): boolean {
  if (a.packageName !== b.packageName || a.anchors.length !== b.anchors.length)
    return false;
  const actual = new Set(b.anchors.map(key));
  return a.anchors.every((anchor) => actual.has(key(anchor)));
}

export function isScreenSignature(value: unknown): value is ScreenSignature {
  if (!value || typeof value !== 'object') return false;
  const s = value as ScreenSignature;
  return (
    s.version === 1 &&
    typeof s.packageName === 'string' &&
    !!s.packageName &&
    Array.isArray(s.anchors) &&
    s.anchors.length > 0 &&
    s.anchors.length <= 5000 &&
    s.anchors.every(
      (a) =>
        a &&
        ['resourceId', 'accessibilityId', 'text'].includes(a.type) &&
        typeof a.value === 'string' &&
        a.value.length > 0 &&
        a.value.length <= 4096,
    )
  );
}

/** Confirma somente observações consecutivas; falha de dump quebra estabilidade. */
export class ScreenObserver {
  private candidate: ScreenSignature | null = null;
  private confirmed: ScreenSignature | null = null;

  observe(current: ScreenSignature | null): ScreenSignature | null {
    if (!current) {
      this.candidate = null;
      return null;
    }
    if (!this.candidate || !sameScreen(this.candidate, current)) {
      this.candidate = current;
      return null;
    }
    if (this.confirmed && sameScreen(this.confirmed, current)) return null;
    this.confirmed = current;
    return current;
  }
}
