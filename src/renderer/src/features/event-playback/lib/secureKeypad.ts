import type { UiElement } from '../../../shared/lib/ui-hierarchy/index.ts';

/** O step guarda apenas a referência; a senha não entra na gravação. */
export function isSecureKeypadVariable(value: unknown): value is string {
  return typeof value === 'string' && /^\{\{[a-zA-Z0-9_]+\}\}$/.test(value);
}

export function validateSecureKeypadPassword(value: string): string {
  if (!/^\d{1,16}$/.test(value))
    throw new Error('A variável da senha deve conter de 1 a 16 dígitos.');
  return value;
}

const pair = /^\s*([0-9])\s*(?:ou|or)\s*([0-9])\s*$/i;
const button = /:id\/btn([1-5])$/;

/** Retorna null enquanto a hierarquia ainda não apresenta um teclado completo. */
export function findSecureKeypadButton(
  elements: UiElement[],
  digit: string,
  expectedPackage?: string,
): UiElement | null {
  const candidates = elements.filter(
    (element) =>
      button.test(element.resourceId) &&
      (!expectedPackage || element.packageName === expectedPackage) &&
      element.enabled &&
      element.bounds[2] > element.bounds[0] &&
      element.bounds[3] > element.bounds[1],
  );
  if (candidates.length !== 5) return null;
  const packages = new Set(candidates.map((element) => element.packageName));
  const ids = new Set(candidates.map((element) => element.resourceId));
  if (packages.size !== 1 || ids.size !== 5)
    throw new Error('Teclado numérico ambíguo na hierarquia atual.');

  const digits = new Map<string, UiElement>();
  for (const element of candidates) {
    const match = pair.exec(element.text || element.contentDesc);
    if (!match || match[1] === match[2]) return null;
    for (const number of [match[1], match[2]]) {
      if (digits.has(number))
        throw new Error('Teclado numérico ambíguo na hierarquia atual.');
      digits.set(number, element);
    }
  }
  if (digits.size !== 10) return null;
  return digits.get(digit) ?? null;
}
