import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialStepFor,
  enrichmentPatch,
} from '../../src/renderer/src/features/event-capture/lib/eventToStep.ts';
import type { CapturedEvent } from '../../src/renderer/src/features/event-capture/ports/IEventCapturePort.ts';

const event: CapturedEvent = {
  gesture: 'tap',
  x: 178,
  y: 1877,
  durationMs: 120,
  displayWidth: 1080,
  displayHeight: 2400,
  enrich: Promise.resolve(null),
};

test('toque pendente e falha de enriquecimento nunca exibem ou persistem coordenadas como seletor', () => {
  const initial = initialStepFor(event, 1, 2);
  assert.equal(initial.pending, true);
  assert.deepEqual(initial.selectors, []);
  assert.equal(initial.label, 'Identificando elemento…');
  const failed = { ...initial, ...enrichmentPatch(event, null) };
  assert.equal(failed.pending, false);
  assert.match(failed.label, /Elemento não identificado/);
  assert.deepEqual(failed.selectors, []);
});

test('enriquecimento preserva ID e texto do campo agência sem fallback por coordenadas', () => {
  const patch = enrichmentPatch(event, {
    resourceId: 'com.test:id/editText',
    contentDesc: '',
    text: 'agência',
    className: 'android.widget.EditText',
    packageName: 'com.test',
    editable: true,
    kind: 'input',
  });
  assert.deepEqual(
    patch.selectors?.map((s) => s.type),
    ['resourceId', 'text'],
  );
  assert.equal(patch.label, 'Toque em Campo "agência"');
});
