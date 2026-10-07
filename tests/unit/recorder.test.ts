import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUiDump } from '../../src/renderer/src/shared/lib/ui-hierarchy/index.ts';
import {
  screenSignature,
  sameScreen,
  ScreenObserver,
  isScreenSignature,
  screenDisplayName,
} from '../../src/renderer/src/shared/lib/screen-signature/index.ts';
import { executeSteps } from '../../src/renderer/src/features/event-playback/lib/runner.ts';
import { waitForScreen } from '../../src/renderer/src/features/event-playback/lib/waitForScreen.ts';
import type { Step } from '../../src/renderer/src/entities/step/index.ts';

function xml(id: string, value = '', extra = '') {
  return `<hierarchy><node package="com.test" resource-id="com.test:id/${id}" class="android.widget.EditText" text="${value}" bounds="[0,0][100,100]"/>${extra}</hierarchy>`;
}
const signature = (id: string) => screenSignature(parseUiDump(xml(id)))!;
const step = (id: number, delayAfterMs = 0): Step => ({
  id,
  type: 'tap',
  label: `Step ${id}`,
  time: '00:01',
  selected: false,
  selectors: [],
  delayAfterMs,
});
const passed = { status: 'passed' as const, message: 'OK' };

test('telas no mesmo pacote têm assinaturas distintas; digitação, foco, ordem e teclado não alteram identidade', () => {
  const a = signature('login');
  assert.equal(sameScreen(a, signature('home')), false);
  const b = screenSignature(
    parseUiDump(
      xml(
        'login',
        'segredo',
        '<node package="com.android.inputmethod.latin" text="Teclado" bounds="[0,0][100,100]"/>',
      ),
    ),
  )!;
  assert.equal(sameScreen(a, b), true);
  assert.equal(JSON.stringify(b).includes('segredo'), false);
  assert.equal(screenSignature([]), null);
});

test('telas nativas com mesmos IDs e títulos diferentes geram transição estável', () => {
  const native = (title: string) =>
    screenSignature(
      parseUiDump(
        `<hierarchy><node package="com.test" resource-id="com.test:id/root" bounds="[0,0][100,100]"/><node package="com.test" resource-id="com.test:id/header" text="${title}" bounds="[0,0][100,20]"/><node package="com.test" resource-id="com.test:id/button" text="Continuar" bounds="[0,20][100,50]"/></hierarchy>`,
      ),
    )!;
  const login = native('Entrar com CPF');
  const account = native('Minha conta');
  assert.equal(sameScreen(login, account), false);
  assert.ok(
    login.anchors.some(
      (a) => a.type === 'text' && a.value === 'Entrar com CPF',
    ),
  );
  const observer = new ScreenObserver();
  assert.equal(observer.observe(login), null);
  assert.deepEqual(observer.observe(login), login);
  assert.equal(observer.observe(account), null);
  assert.deepEqual(observer.observe(account), account);
  assert.equal(observer.observe(account), null);
});

test('nome da tela de senha prioriza título e ignora controles de voltar e glifos', () => {
  const signature = screenSignature(
    parseUiDump(
      '<hierarchy><node package="com.test" resource-id="com.test:id/backButton" content-desc="voltar" bounds="[0,0][10,10]"/><node package="com.test" text="" bounds="[10,0][20,10]"/><node package="com.test" resource-id="com.test:id/text_view_header_login_password" text="Digite a senha de acesso" bounds="[0,20][100,40]"/><node package="com.test" resource-id="com.test:id/btn1" text="0 ou 1" bounds="[0,50][50,80]"/></hierarchy>',
    ),
  )!;
  assert.equal(screenDisplayName(signature), 'Digite a senha de acesso');
});

test('accessibility-id e texto são fallback quando não há resource-id; entidades XML são decodificadas', () => {
  const parsed = parseUiDump(
    '<node package="com.test" content-desc="A &amp; B" bounds="[0,0][10,10]"/><node package="com.test" text="Home" bounds="[0,0][10,10]"/>',
  );
  const result = screenSignature(parsed)!;
  assert.deepEqual(
    new Set(result.anchors.map((a) => a.value)),
    new Set(['A & B', 'Home']),
  );
  assert.equal(
    sameScreen(result, { ...result, anchors: result.anchors.toReversed() }),
    true,
  );
});

test('duas observações confirmam tela inicial/transição; repetições não duplicam; erro quebra estabilidade', () => {
  const observer = new ScreenObserver();
  const a = signature('login'),
    b = signature('home');
  assert.equal(observer.observe(a), null);
  assert.deepEqual(observer.observe(a), a);
  assert.equal(observer.observe(a), null);
  assert.equal(observer.observe(b), null);
  assert.equal(observer.observe(null), null);
  assert.equal(observer.observe(b), null);
  assert.deepEqual(observer.observe(b), b);
  assert.equal(observer.observe(a), null);
  assert.deepEqual(observer.observe(a), a);
});

test('valida assinatura importada sem aceitar pacote vazio ou âncoras desconhecidas', () => {
  assert.equal(isScreenSignature(signature('login')), true);
  for (const invalid of [
    null,
    {},
    { version: 1, packageName: 'com.test', anchors: [] },
    {
      version: 1,
      packageName: 'com.test',
      anchors: [{ type: 'coordinates', value: '[1,2]' }],
    },
  ])
    assert.equal(isScreenSignature(invalid), false);
});

test('progresso de início é emitido antes de resolver a ação lenta; ordem usa IDs reais', async () => {
  const events: string[] = [];
  const result = await executeSteps(
    [step(8), step(3)],
    async (s) => {
      assert.equal(events.at(-1), `${s.id}:running`);
      await Promise.resolve();
      return passed;
    },
    new AbortController().signal,
    (_, s, p) => events.push(`${s.id}:${p.status}`),
  );
  assert.deepEqual(events, ['8:running', '8:passed', '3:running', '3:passed']);
  assert.equal(result.completed, 2);
  assert.equal(result.status, 'passed');
});

test('falha interrompe o fluxo e não marca conclusão', async () => {
  const ids: number[] = [];
  const result = await executeSteps(
    [step(1), step(2)],
    async (s) => {
      ids.push(s.id);
      throw new Error('Tela errada');
    },
    new AbortController().signal,
  );
  assert.deepEqual(ids, [1]);
  assert.equal(result.status, 'failed');
  assert.equal(result.completed, 0);
  assert.match(result.message, /Tela errada/);
});

test('cancelamento durante ação impede próximo step e conclusão falsa', async () => {
  const abort = new AbortController();
  const ids: number[] = [];
  const result = await executeSteps(
    [step(1), step(2)],
    async (s) => {
      ids.push(s.id);
      abort.abort();
      return passed;
    },
    abort.signal,
  );
  assert.deepEqual(ids, [1]);
  assert.equal(result.status, 'cancelled');
});

test('delay é aplicado entre passos, nunca após o último', async () => {
  const started: number[] = [];
  const states: string[] = [];
  const result = await executeSteps(
    [step(1, 35), step(2, 300_000)],
    async () => {
      started.push(Date.now());
      return passed;
    },
    new AbortController().signal,
    (_, s, p) => states.push(`${s.id}:${p.status}`),
  );
  assert.ok(started[1] - started[0] >= 30);
  assert.ok(states.includes('1:waiting'));
  assert.ok(!states.includes('2:waiting'));
  assert.equal(result.status, 'passed');
});

test('cancelar durante delay interrompe a espera e não envia próxima ação', async () => {
  const abort = new AbortController();
  const ids: number[] = [];
  const result = await executeSteps(
    [step(1, 300_000), step(2)],
    async (s) => {
      ids.push(s.id);
      return passed;
    },
    abort.signal,
    (_, __, p) => {
      if (p.status === 'waiting') setTimeout(() => abort.abort(), 5);
    },
  );
  assert.deepEqual(ids, [1]);
  assert.equal(result.status, 'cancelled');
  assert.equal(result.completed, 1);
});

test('espera pela assinatura correta mesmo dentro do mesmo pacote', async () => {
  const reads = [signature('login'), signature('home'), signature('home')];
  let count = 0;
  await waitForScreen(
    signature('home'),
    async () => reads[count++],
    new AbortController().signal,
    2000,
  );
  assert.equal(count, 3);
});

test('tela errada gera timeout e erro de leitura não vira sucesso', async () => {
  await assert.rejects(
    waitForScreen(
      signature('home'),
      async () => signature('login'),
      new AbortController().signal,
      5,
    ),
    /Timeout/,
  );
  await assert.rejects(
    waitForScreen(
      signature('home'),
      async () => {
        throw new Error('Device desconectou');
      },
      new AbortController().signal,
    ),
    /Device desconectou/,
  );
});

test('timeout também limita leitura travada; cancelar interrompe o reconhecimento', async () => {
  await assert.rejects(
    waitForScreen(
      signature('home'),
      () => new Promise(() => {}),
      new AbortController().signal,
      10,
    ),
    /Timeout/,
  );
  const abort = new AbortController();
  const waiting = waitForScreen(
    signature('home'),
    async () => signature('login'),
    abort.signal,
  );
  abort.abort();
  await assert.rejects(waiting, { name: 'AbortError' });
});

test('agência usa combinação de ID repetido + texto e resolve posição atual em outro device', async () => {
  const { resolveUiElement } =
    await import('../../src/renderer/src/shared/lib/ui-hierarchy/index.ts');
  const nodes = parseUiDump(
    '<hierarchy><node resource-id="com.test:id/editText" text="conta" class="android.widget.EditText" bounds="[10,30][110,80]"/><node resource-id="com.test:id/editText" text="agência" class="android.widget.EditText" bounds="[300,400][700,500]"/></hierarchy>',
  );
  const target = resolveUiElement(nodes, [
    { type: 'resourceId', value: 'com.test:id/editText' },
    { type: 'text', value: 'agência' },
    { type: 'coordinates', value: '[1,2]' },
  ]);
  assert.deepEqual(target.bounds, [300, 400, 700, 500]);
  assert.throws(
    () =>
      resolveUiElement(nodes, [
        { type: 'resourceId', value: 'com.test:id/editText' },
      ]),
    /ambíguo/,
  );
  assert.throws(
    () => resolveUiElement(nodes, [{ type: 'coordinates', value: '[1,2]' }]),
    /coordenadas não são usadas/,
  );
  assert.throws(
    () =>
      resolveUiElement(nodes, [
        { type: 'resourceId', value: 'com.test:id/editText' },
        { type: 'text', value: 'senha' },
      ]),
    /não encontrado/,
  );
});

test('abertura por pacote só é inferida quando o toque parte do launcher', async () => {
  const { appLaunchPatch } =
    await import('../../src/renderer/src/features/event-capture/lib/appLaunch.ts');
  assert.deepEqual(appLaunchPatch(true, 'com.test.launcher', 'com.test.bank'), {
    type: 'launchApp',
    label: 'Abrir app com.test.bank',
    value: 'com.test.bank',
    selectors: [],
    pending: false,
  });
  assert.equal(appLaunchPatch(false, 'com.test.other', 'com.test.bank'), null);
  assert.equal(
    appLaunchPatch(true, 'com.test.launcher', 'com.test.launcher'),
    null,
  );
  assert.equal(
    appLaunchPatch(true, 'com.test.launcher', 'com.android.systemui'),
    null,
  );
  assert.equal(
    appLaunchPatch(true, 'com.test.launcher', 'invalid package'),
    null,
  );
});

test('polling aguarda elemento aparecer e estabilizar sem reutilizar coordenadas gravadas', async () => {
  const { waitForTarget } =
    await import('../../src/renderer/src/features/event-playback/lib/waitForTarget.ts');
  const nodes = parseUiDump(xml('login'));
  let reads = 0;
  const target = await waitForTarget(
    [{ type: 'resourceId', value: 'com.test:id/login' }],
    async () => (++reads === 1 ? [] : nodes),
    new AbortController().signal,
    undefined,
    2500,
  );
  assert.equal(reads, 3);
  assert.equal(target.resourceId, 'com.test:id/login');
});

test('polling de elemento desabilitado termina por timeout e não executa clique', async () => {
  const { waitForTarget } =
    await import('../../src/renderer/src/features/event-playback/lib/waitForTarget.ts');
  const nodes = parseUiDump(xml('login')).map((node) => ({
    ...node,
    enabled: false,
  }));
  await assert.rejects(
    waitForTarget(
      [{ type: 'resourceId', value: 'com.test:id/login' }],
      async () => nodes,
      new AbortController().signal,
      undefined,
      10,
    ),
    /Timeout/,
  );
});

test('polling não resolve ambiguidade escolhendo o primeiro e pode ser cancelado', async () => {
  const { waitForTarget } =
    await import('../../src/renderer/src/features/event-playback/lib/waitForTarget.ts');
  const nodes = parseUiDump(xml('login'));
  await assert.rejects(
    waitForTarget(
      [{ type: 'resourceId', value: 'com.test:id/login' }],
      async () => [...nodes, ...nodes],
      new AbortController().signal,
    ),
    /ambíguo/,
  );
  const abort = new AbortController();
  const waiting = waitForTarget(
    [{ type: 'resourceId', value: 'com.test:id/login' }],
    async () => [],
    abort.signal,
  );
  abort.abort();
  await assert.rejects(waiting, { name: 'AbortError' });
});

test('digitação sem seletor só avança com um campo editável focado', async () => {
  const { waitForFocusedInput } =
    await import('../../src/renderer/src/features/event-playback/lib/waitForFocusedInput.ts');
  const field = parseUiDump(
    '<hierarchy><node package="com.test" class="android.widget.EditText" bounds="[0,0][100,100]" focused="true"/></hierarchy>',
  );
  let reads = 0;
  const found = await waitForFocusedInput(
    async () =>
      ++reads === 1
        ? field.map((node) => ({ ...node, focused: false }))
        : field,
    new AbortController().signal,
    undefined,
    1_000,
  );
  assert.equal(reads, 2);
  assert.equal(found.focused, true);
  await assert.rejects(
    waitForFocusedInput(
      async () => field.map((node) => ({ ...node, focused: false })),
      new AbortController().signal,
      undefined,
      10,
    ),
    /Nenhum campo de texto focado/,
  );
});

test('condição pronta antecipa o delay e inicia o próximo step', async () => {
  const started = Date.now();
  const ids: number[] = [];
  const result = await executeSteps(
    [step(1, 500), step(2)],
    async (current) => {
      ids.push(current.id);
      return passed;
    },
    new AbortController().signal,
    undefined,
    async (next, maxMs) => {
      assert.equal(next.id, 2);
      assert.equal(maxMs, 500);
      return 'ready';
    },
  );
  assert.deepEqual(ids, [1, 2]);
  assert.equal(result.status, 'passed');
  assert.ok(Date.now() - started < 250);
});

test('step sem condição observável mantém o delay integral', async () => {
  const started = Date.now();
  const result = await executeSteps(
    [step(1, 35), step(2)],
    async () => passed,
    new AbortController().signal,
    undefined,
    async () => 'unsupported',
  );
  assert.equal(result.status, 'passed');
  assert.ok(Date.now() - started >= 30);
});

test('leitura transitória vazia não interrompe busca do botão semanticamente identificado', async () => {
  const { UiHierarchyUnavailableError } =
    await import('../../src/renderer/src/shared/lib/adb-ui/index.ts');
  const { waitForTarget } =
    await import('../../src/renderer/src/features/event-playback/lib/waitForTarget.ts');
  const nodes = parseUiDump(
    '<hierarchy><node package="com.itau" resource-id="com.itau:id/account_info_container" bounds="[0,0][100,100]"/></hierarchy>',
  );
  let reads = 0;
  const result = await waitForTarget(
    [{ type: 'resourceId', value: 'com.itau:id/account_info_container' }],
    async () => {
      if (++reads === 1)
        throw new UiHierarchyUnavailableError('Dump temporariamente vazio.');
      return nodes;
    },
    new AbortController().signal,
    undefined,
    2_000,
  );
  assert.equal(result.resourceId, 'com.itau:id/account_info_container');
  assert.equal(reads, 3);
  await assert.rejects(
    waitForTarget(
      [{ type: 'resourceId', value: 'com.itau:id/account_info_container' }],
      async () => {
        throw new UiHierarchyUnavailableError('Dump temporariamente vazio.');
      },
      new AbortController().signal,
      undefined,
      10,
    ),
    /Timeout: Dump temporariamente vazio/,
  );
});
