import type { Step, Selector, StepType } from '../../../entities/step/index.ts';
import type {
  CapturedEvent,
  EnrichedFields,
} from '../ports/IEventCapturePort.ts';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function stepTypeFor(gesture: CapturedEvent['gesture']): StepType {
  if (gesture === 'longPress') return 'longPress';
  if (gesture === 'swipe') return 'swipe';
  return 'tap';
}

function prefixFor(gesture: CapturedEvent['gesture']): string {
  if (gesture === 'longPress') return 'Toque longo em';
  if (gesture === 'swipe') return 'Arrastar em';
  return 'Toque em';
}

const KIND_LABELS: Record<EnrichedFields['kind'], string> = {
  input: 'Campo',
  button: 'Botão',
  toggle: 'Toggle',
  checkbox: 'Checkbox',
  radio: 'Radio',
  link: 'Link',
  image: 'Imagem',
  'list-item': 'Item',
  text: 'Texto',
  container: 'Elemento',
};

/**
 * Step inicial — gesto com identidade ainda pendente. Marcado como `pending: true`
 * porque o seletor ainda está sendo resolvido em background.
 */
export function initialStepFor(
  event: CapturedEvent,
  id: number,
  recordingSeconds: number,
): Step {
  return {
    id,
    type: stepTypeFor(event.gesture),
    label: 'Identificando elemento…',
    time: formatTime(recordingSeconds),
    selected: false,
    pending: true,
    selectors: [],
  };
}

/**
 * Patch a aplicar quando o enrichment resolver. Retorna um subconjunto de
 * campos do Step (label, selectors, pending=false).
 */
export function enrichmentPatch(
  event: CapturedEvent,
  enriched: EnrichedFields | null,
): Partial<Step> {
  if (!enriched) {
    return {
      pending: false,
      label: 'Elemento não identificado — grave novamente',
      selectors: [],
    };
  }

  const selectors: Selector[] = [];
  const hasResourceId = !!enriched.resourceId;

  if (enriched.resourceId) {
    selectors.push({
      type: 'resourceId',
      value: enriched.resourceId,
      stability: 'stable',
      recommended: true,
    });
  }
  if (enriched.contentDesc) {
    selectors.push({
      type: 'accessibilityId',
      value: enriched.contentDesc,
      stability: 'stable',
      recommended: !hasResourceId,
    });
  }
  if (enriched.text) {
    selectors.push({
      type: 'text',
      value: enriched.text,
      stability: 'medium',
    });
  }

  if (!selectors.length)
    return {
      pending: false,
      label: 'Elemento não identificado — grave novamente',
      selectors: [],
    };

  const kindLabel = KIND_LABELS[enriched.kind];
  const rawLabel =
    enriched.text || enriched.contentDesc || enriched.resourceId || '';
  const target = rawLabel
    ? `${kindLabel} "${extractIdTail(rawLabel)}"`
    : kindLabel;

  return {
    label: `${prefixFor(event.gesture)} ${target}`,
    selectors,
    pending: false,
  };
}

/** Para resource-ids longos (com.app:id/btn_ok → btn_ok). */
function extractIdTail(s: string): string {
  const slash = s.lastIndexOf('/');
  if (slash >= 0) return s.slice(slash + 1);
  return s;
}
