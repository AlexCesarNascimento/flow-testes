import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecordingExport,
  parseRecordingImport,
} from '../../src/renderer/src/features/flow-export/index.ts';
import type { Step } from '../../src/renderer/src/entities/step/index.ts';

const screen: Step = {
  id: 42,
  type: 'waitForPage',
  label: 'Home',
  time: '00:04',
  selected: false,
  selectors: [],
  delayAfterMs: 2500,
  screenSignature: {
    version: 1,
    packageName: 'com.test',
    anchors: [{ type: 'resourceId', value: 'com.test:id/home' }],
  },
};
function fixture() {
  return buildRecordingExport({
    title: 'Teste',
    recordingSeconds: 4,
    steps: [screen],
    device: { name: null, displayWidth: 0, displayHeight: 0 },
  });
}

test('export/import preserva assinatura e delay, renumerando apenas o ID', () => {
  const exported = fixture();
  const actual = parseRecordingImport(JSON.stringify(exported), 7).steps[0];
  assert.deepEqual(actual, { ...screen, id: 7, value: undefined });
});

test('fluxo legado sem assinatura/delay continua legível e usa delay zero', () => {
  const exported = fixture();
  exported.schemaVersion = '1.0.0';
  delete exported.steps[0].screenSignature;
  delete exported.steps[0].delayAfterMs;
  const actual = parseRecordingImport(JSON.stringify(exported)).steps[0];
  assert.equal(actual.screenSignature, undefined);
  assert.equal(actual.delayAfterMs, 0);
});

test('import rejeita assinatura vazia e delays inválidos', () => {
  for (const delay of [-1, 300001, '5']) {
    const exported = fixture();
    Object.assign(exported.steps[0], { delayAfterMs: delay });
    assert.throws(
      () => parseRecordingImport(JSON.stringify(exported)),
      /Delay inválido/,
    );
  }
  const exported = fixture();
  exported.steps[0].screenSignature!.anchors = [];
  assert.throws(
    () => parseRecordingImport(JSON.stringify(exported)),
    /Assinatura/,
  );
});

test('import/export remove fallback legado de coordenadas e marca identidade ausente', () => {
  const legacy = fixture();
  legacy.steps[0] = {
    index: 0,
    type: 'tap',
    label: 'Toque em [100,200]',
    time: '00:01',
    value: null,
    selectors: [
      { type: 'coordinates', value: '[100,200]', stability: 'fragile' },
    ],
  };
  const imported = parseRecordingImport(JSON.stringify(legacy)).steps[0];
  assert.deepEqual(imported.selectors, []);
  assert.match(imported.label, /Elemento não identificado/);
  const exported = buildRecordingExport({
    title: 'Teste',
    recordingSeconds: 0,
    steps: [
      {
        ...imported,
        label: 'Toque em [100,200]',
        selectors: legacy.steps[0].selectors,
      },
    ],
    device: { name: null, displayWidth: 0, displayHeight: 0 },
  });
  assert.deepEqual(exported.steps[0].selectors, []);
  assert.match(exported.steps[0].label, /Elemento não identificado/);
});

test('timeout opcional é preservado no JSON v1.3 e validado na importação', () => {
  const rec = buildRecordingExport({
    title: 'Timeout',
    recordingSeconds: 0,
    steps: [{ ...screen, timeoutMs: 2500 }],
    device: { name: null, displayWidth: 0, displayHeight: 0 },
  });
  assert.equal(rec.schemaVersion, '1.3.0');
  assert.equal(
    parseRecordingImport(JSON.stringify(rec)).steps[0].timeoutMs,
    2500,
  );
  for (const invalid of [0, 999, 120001, null, '1000']) {
    Object.assign(rec.steps[0], { timeoutMs: invalid });
    assert.throws(
      () => parseRecordingImport(JSON.stringify(rec)),
      /Timeout inválido/,
    );
  }
});
