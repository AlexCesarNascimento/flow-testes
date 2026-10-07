import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withStepTimeout } from '../../src/renderer/src/features/event-playback/lib/withStepTimeout.ts';

test('timeout personalizado interrompe sinal de uma ação travada', async () => {
  let actionSignal: AbortSignal | undefined;
  await assert.rejects(
    withStepTimeout(
      (signal) => {
        actionSignal = signal;
        return new Promise(() => {});
      },
      new AbortController().signal,
      1000,
    ),
    /excedeu 1 s/,
  );
  assert.equal(actionSignal?.aborted, true);
});

test('ação pronta não espera timeout; cancelamento mantém sua identidade', async () => {
  assert.equal(
    await withStepTimeout(
      async () => 'pronto',
      new AbortController().signal,
      120_000,
    ),
    'pronto',
  );
  const controller = new AbortController();
  const pending = withStepTimeout(
    () => new Promise(() => {}),
    controller.signal,
    120_000,
  );
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
