import {
  test,
  expect,
  _electron,
  type ElectronApplication,
  type Page,
} from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let electron: ElectronApplication;
let page: Page;
let profile: string;

test.beforeEach(async () => {
  profile = await mkdtemp(join(tmpdir(), 'flowtest-recorder-test-'));
  electron = await _electron.launch({
    args: ['.', `--user-data-dir=${profile}`],
    env: { ...process.env, ELECTRON_RENDERER_URL: 'http://127.0.0.1:5180' },
  });
  page = await electron.firstWindow();
  await page
    .getByRole('button', { name: 'Adicionar step manualmente' })
    .waitFor();
});

test.afterEach(async () => {
  await electron?.close();
  if (profile) await rm(profile, { recursive: true, force: true });
});

async function arrange(delayAfterMs = 100) {
  await page.evaluate(async (delay) => {
    const load = (path: string) => import(path);
    const { useRecorderStore } = await load(
      '/src/entities/recorder/model/store.ts',
    );
    const { setAdbPort } = await load('/src/shared/lib/adb-runner/index.ts');
    const fixture = {
      commands: [] as string[][],
      screen: 'login',
      packageName: 'com.test',
      hierarchy: '',
      emit: (_text: string) => {
        void _text;
      },
      holdDump: false,
      holdLaunch: false,
      emptyAfterInput: false,
      emptyHierarchyReads: 0,
      onInput: (_args: string[]) => {
        void _args;
      },
      releaseDump: () => {},
    };
    Object.assign(window, { recorderFixture: fixture });
    const xml = () =>
      fixture.hierarchy ||
      `<hierarchy><node package="${fixture.packageName}" resource-id="com.test:id/${fixture.screen}" class="android.widget.Button" bounds="[0,0][100,100]"/></hierarchy>`;
    const xmlForRead = () => {
      if (fixture.emptyHierarchyReads > 0) {
        fixture.emptyHierarchyReads--;
        return '<hierarchy rotation="0"/>';
      }
      return xml();
    };
    setAdbPort({
      getAdb: () => ({
        subprocess: {
          noneProtocol: {
            spawnWaitText: async (args: string[]) =>
              args[0] === 'wm'
                ? 'Physical size: 100x100'
                : 'add device 1: /dev/input/event1\n ABS_MT_POSITION_X max 100\n ABS_MT_POSITION_Y max 100',
            spawn: async (args: string[]) => {
              fixture.commands.push(args);
              let closed = false;
              let controller: ReadableStreamDefaultController<Uint8Array>;
              const output = new ReadableStream<Uint8Array>({
                start(c) {
                  controller = c;
                },
              });
              if (args[0] === 'getevent') {
                fixture.emit = (text: string) =>
                  controller.enqueue(new TextEncoder().encode(text));
                return {
                  output,
                  kill: async () => {
                    if (!closed) {
                      controller.close();
                      closed = true;
                    }
                  },
                };
              }
              const timer = setTimeout(
                () => {
                  if (closed) return;
                  if (args[0] === 'monkey' && fixture.holdLaunch) return;
                  if (args[0] === 'input') {
                    fixture.screen = 'home';
                    fixture.onInput(args);
                    if (fixture.emptyAfterInput)
                      fixture.emptyHierarchyReads = 1;
                  }
                  const finish = () => {
                    const text =
                      args[0] === 'cat'
                        ? xmlForRead()
                        : args[0] === 'uiautomator'
                          ? 'UI hierarchy dumped to file'
                          : args[0] === 'cmd'
                            ? 'com.test.launcher/.Main'
                            : args[0] === 'monkey'
                              ? 'Events injected: 1'
                              : '';
                    controller.enqueue(new TextEncoder().encode(text));
                    controller.close();
                    closed = true;
                  };
                  if (
                    args[0] === 'uiautomator' &&
                    fixture.holdDump &&
                    fixture.screen === 'home'
                  ) {
                    fixture.releaseDump = () => {
                      fixture.holdDump = false;
                      finish();
                    };
                  } else finish();
                },
                args[0] === 'input' ? 500 : 20,
              );
              return {
                output,
                kill: async () => {
                  clearTimeout(timer);
                  if (!closed) {
                    controller.close();
                    closed = true;
                  }
                },
              };
            },
          },
        },
      }),
    });
    useRecorderStore.setState({
      recording: false,
      steps: [
        {
          id: 8,
          type: 'tap',
          label: 'Abrir Home',
          time: '00:04',
          delayAfterMs: delay,
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/login',
              stability: 'stable',
            },
          ],
        },
        {
          id: 3,
          type: 'waitForPage',
          label: 'Reconhecer Home',
          time: '00:09',
          delayAfterMs: 0,
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/home',
              stability: 'stable',
            },
          ],
          screenSignature: {
            version: 1,
            packageName: 'com.test',
            anchors: [{ type: 'resourceId', value: 'com.test:id/home' }],
          },
        },
      ],
    });
  }, delayAfterMs);
}

test('Electron mantém isolamento e mostra progresso antes da ação, delay e reconhecimento', async () => {
  const isolation = await page.evaluate(() => ({
    nodeAvailable: 'require' in window,
    bridgeAvailable: 'api' in window,
  }));
  expect(isolation).toEqual({ nodeAvailable: false, bridgeAvailable: true });
  await arrange(500);
  await page
    .getByRole('button', { name: 'Expandir step 8: Abrir Home', exact: true })
    .click();
  const delay = page.getByRole('spinbutton', {
    name: 'Delay máximo até o próximo passo após step 8, em segundos',
  });
  await expect(delay).toHaveValue('0.5');
  await delay.fill('0.8');
  await expect(page.getByText('00:04', { exact: true })).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  const first = page.locator('.steps-panel__item[aria-current="step"]');
  await expect(first).toContainText('Abrir Home');
  await expect(first).toHaveAttribute('data-run-status', 'running');
  const timer = page.getByRole('timer', { name: 'Tempo de execução' });
  await expect(timer).toBeVisible();
  const started = await timer.textContent();
  await expect.poll(() => timer.textContent()).not.toBe(started);
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 2 steps.',
  );
  await expect(page.locator('.steps-panel__result--passed')).toHaveCount(2);
  const finished = await timer.textContent();
  await page.clock.install();
  await page.clock.fastForward(1000);
  await expect(timer).toHaveText(finished!);
  await page.screenshot({ path: 'artifacts/recorder-playback-delay.png' });
});

test('cancelar durante delay preserva cancelamento e não executa o próximo reconhecimento', async () => {
  await arrange(30_000);
  await page.evaluate(() => {
    (
      window as unknown as { recorderFixture: { holdDump: boolean } }
    ).recorderFixture.holdDump = true;
  });
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(
    page.locator('.steps-panel__item[data-run-status="waiting"]'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Pausar execução', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Cancelado',
  );
  const commands = await page.evaluate(
    () =>
      (window as unknown as { recorderFixture: { commands: string[][] } })
        .recorderFixture.commands,
  );
  expect(
    commands.filter((args) => args[0] === 'uiautomator').length,
  ).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.steps-panel__item[data-run-status]')).toHaveCount(
    1,
  );
  await expect(page.locator('.steps-panel__run-info')).not.toContainText(
    'Concluído',
  );
});

test('device ausente falha no primeiro step sem avançar nem mostrar sucesso', async () => {
  await arrange();
  await page.evaluate(async () => {
    const path = '/src/shared/lib/adb-runner/index.ts';
    const { setAdbPort } = await import(path);
    setAdbPort(null);
  });
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Device não conectado',
  );
  await expect(page.locator('.steps-panel__result--failed')).toHaveCount(1);
  await expect(page.locator('.steps-panel__result--passed')).toHaveCount(0);
});

test('captura reconhece tela inicial, navegação por toque e transição sem novo toque', async () => {
  await arrange();
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { useRecorderStore } = await load(
      '/src/entities/recorder/model/store.ts',
    );
    const { useDeviceStore } = await load(
      '/src/entities/device/model/store.ts',
    );
    useRecorderStore.setState({ steps: [] });
    useDeviceStore.setState({ status: 'streaming' });
  });
  await page
    .getByRole('button', { name: 'Iniciar gravação', exact: true })
    .click();
  await expect(page.locator('.steps-panel__item')).toHaveCount(1, {
    timeout: 10_000,
  });
  await expect(page.locator('.steps-panel__item')).toContainText('login');
  await page.evaluate(() => {
    const fixture = (
      window as unknown as {
        recorderFixture: { screen: string; emit: (text: string) => void };
      }
    ).recorderFixture;
    fixture.emit(
      '[ 1.000] EV_ABS ABS_MT_TRACKING_ID 00000001\n[ 1.001] EV_ABS ABS_MT_POSITION_X 00000032\n[ 1.001] EV_ABS ABS_MT_POSITION_Y 00000032\n[ 1.100] EV_ABS ABS_MT_TRACKING_ID ffffffff\n',
    );
    fixture.screen = 'home';
  });
  await expect(page.locator('.steps-panel__item')).toHaveCount(3, {
    timeout: 10_000,
  });
  await expect(page.locator('.steps-panel__item').nth(1)).toContainText(
    'Toque',
  );
  await expect(page.locator('.steps-panel__item').nth(2)).toContainText('home');
  await page.evaluate(() => {
    (
      window as unknown as { recorderFixture: { screen: string } }
    ).recorderFixture.screen = 'settings';
  });
  await expect(page.locator('.steps-panel__item')).toHaveCount(4, {
    timeout: 10_000,
  });
  await expect(page.locator('.steps-panel__item').nth(3)).toContainText(
    'settings',
  );
  await page
    .getByRole('button', { name: 'Finalizar gravação', exact: true })
    .click();
});

test('agência com ID repetido usa texto e bounds atuais; legado por coordenada falha', async () => {
  await arrange();
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    const fixture = (
      window as unknown as { recorderFixture: { hierarchy: string } }
    ).recorderFixture;
    fixture.hierarchy =
      '<hierarchy><node package="com.test" resource-id="com.test:id/editText" text="conta" bounds="[0,0][100,100]"/><node package="com.test" resource-id="com.test:id/editText" text="agência" bounds="[300,400][700,500]"/></hierarchy>';
    useRecorderStore.setState({
      steps: [
        {
          id: 1,
          type: 'tap',
          label: 'Agência',
          time: '00:01',
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/editText',
              stability: 'stable',
            },
            { type: 'text', value: 'agência', stability: 'medium' },
          ],
        },
      ],
    });
  });
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído',
  );
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { recorderFixture: { commands: string[][] } }
      ).recorderFixture.commands.filter((a) => a[0] === 'input'),
    ),
  ).toEqual([['input', 'tap', '500', '450']]);
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    useRecorderStore.setState({
      steps: [
        {
          id: 2,
          type: 'tap',
          label: 'Toque em [10,20]',
          time: '00:01',
          selected: false,
          selectors: [
            { type: 'coordinates', value: '[10,20]', stability: 'fragile' },
          ],
        },
      ],
    });
  });
  await expect(page.locator('.steps-panel__item')).toContainText(
    'Elemento não identificado',
  );
  await expect(page.locator('.steps-panel__item')).not.toContainText('[10,20]');
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'coordenadas não são usadas',
  );
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as { recorderFixture: { commands: string[][] } }
        ).recorderFixture.commands.filter((a) => a[0] === 'input').length,
    ),
  ).toBe(1);
});

test('toque no ícone do launcher vira abertura por pacote e reconhecimento do app', async () => {
  await arrange();
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { useRecorderStore } = await load(
      '/src/entities/recorder/model/store.ts',
    );
    const { useDeviceStore } = await load(
      '/src/entities/device/model/store.ts',
    );
    const fixture = (
      window as unknown as { recorderFixture: { packageName: string } }
    ).recorderFixture;
    fixture.packageName = 'com.test.launcher';
    useRecorderStore.setState({ steps: [] });
    useDeviceStore.setState({ status: 'streaming' });
  });
  await page
    .getByRole('button', { name: 'Iniciar gravação', exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/src/entities/recorder/model/store.ts';
        return (await import(path)).useRecorderStore.getState().captureStatus;
      }),
    )
    .toBe('ready');
  await expect(page.locator('.steps-panel__item')).toHaveCount(0);
  await page.evaluate(() => {
    const fixture = (
      window as unknown as {
        recorderFixture: {
          screen: string;
          packageName: string;
          emit: (text: string) => void;
        };
      }
    ).recorderFixture;
    fixture.emit(
      '[ 1.000] EV_ABS ABS_MT_TRACKING_ID 00000001\n[ 1.001] EV_ABS ABS_MT_POSITION_X 00000032\n[ 1.001] EV_ABS ABS_MT_POSITION_Y 00000032\n[ 1.100] EV_ABS ABS_MT_TRACKING_ID ffffffff\n',
    );
    fixture.packageName = 'com.test.bank';
    fixture.screen = 'home';
  });
  await expect(page.locator('.steps-panel__item')).toHaveCount(2);
  await expect(page.locator('.steps-panel__item').first()).toContainText(
    'Abrir app',
  );
  await expect(page.locator('.steps-panel__item').first()).toContainText(
    'com.test.bank',
  );
  await page
    .getByRole('button', { name: 'Finalizar gravação', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 2 steps.',
  );
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { recorderFixture: { commands: string[][] } }
      ).recorderFixture.commands.filter((a) => a[0] === 'monkey'),
    ),
  ).toEqual([
    [
      'monkey',
      '-p',
      'com.test.bank',
      '-c',
      'android.intent.category.LAUNCHER',
      '1',
    ],
  ]);
});

test('abertura de app sem resposta termina por timeout e não avança', async () => {
  await arrange();
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    (
      window as unknown as { recorderFixture: { holdLaunch: boolean } }
    ).recorderFixture.holdLaunch = true;
    const steps = useRecorderStore.getState().steps;
    useRecorderStore.setState({
      steps: [
        {
          ...steps[0],
          type: 'launchApp',
          label: 'Abrir app de teste',
          value: 'com.test.bank',
        },
        steps[1],
      ],
    });
  });
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'aguardando resposta do device',
  );
  await expect(
    page.getByRole('timer', { name: 'Tempo de execução' }),
  ).toBeVisible();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Tempo limite do comando',
    { timeout: 15_000 },
  );
  await expect(page.locator('.steps-panel__result--failed')).toHaveCount(1);
  await expect(page.locator('.steps-panel__result--passed')).toHaveCount(0);
});

test('Play executa todos os steps mesmo com apenas a abertura de app marcada', async () => {
  await arrange();
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    const steps = useRecorderStore.getState().steps;
    useRecorderStore.setState({
      steps: [
        {
          ...steps[0],
          type: 'launchApp',
          label: 'Abrir app de teste',
          value: 'com.test.bank',
          selected: false,
        },
        steps[1],
      ],
    });
    (
      window as unknown as { recorderFixture: { screen: string } }
    ).recorderFixture.screen = 'home';
  });
  await page.getByRole('checkbox', { name: 'Selecionar step 8' }).check();
  await expect(
    page.getByRole('checkbox', { name: 'Selecionar step 8' }),
  ).toBeChecked();
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 2 steps.',
  );
  await expect(page.locator('.steps-panel__result--passed')).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 2 steps.',
  );
  await expect(page.locator('.steps-panel__result--passed')).toHaveCount(2);
});

test('vincular variável atualiza o input e o playback usa a massa ativa no campo identificado', async () => {
  await arrange();
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { useRecorderStore } = await load(
      '/src/entities/recorder/model/store.ts',
    );
    const { useDatasetStore } = await load(
      '/src/entities/dataset/model/store.ts',
    );
    useDatasetStore.setState({
      columns: ['agencia', 'conta'],
      rows: [{ agencia: '4321', conta: '9876' }],
      activeRowIndex: 0,
    });
    useRecorderStore.setState({
      recorderPhase: 'editar',
      selectedStepId: 1,
      inspectorOpen: true,
      steps: [
        {
          id: 1,
          type: 'inputText',
          label: 'Digitar inicial',
          value: 'inicial',
          time: '--:--',
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/editText',
              stability: 'stable',
            },
            { type: 'text', value: 'agência', stability: 'medium' },
          ],
        },
      ],
    });
    (
      window as unknown as { recorderFixture: { hierarchy: string } }
    ).recorderFixture.hierarchy =
      '<hierarchy><node package="com.test" resource-id="com.test:id/editText" text="agência" class="android.widget.EditText" bounds="[0,0][100,100]"/><node package="com.test" resource-id="com.test:id/editText" text="conta" class="android.widget.EditText" bounds="[200,200][300,300]"/></hierarchy>';
  });
  const value = page.getByRole('textbox', {
    name: 'Valor digitado no step',
    exact: true,
  });
  await expect(value).toHaveValue('inicial');
  await page
    .getByRole('combobox', { name: 'Escolha a coluna do dataset', exact: true })
    .selectOption('agencia');
  await expect(value).toHaveValue('{{agencia}}');
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 1 step.',
  );
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { recorderFixture: { commands: string[][] } }
      ).recorderFixture.commands.filter((a) => a[0] === 'input'),
    ),
  ).toEqual([
    ['input', 'tap', '50', '50'],
    ['input', 'text', '4321'],
  ]);
  await value.fill('{{conta}}');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/src/entities/recorder/model/store.ts';
        return (await import(path)).useRecorderStore.getState().steps[0].value;
      }),
    )
    .toBe('{{conta}}');
  await page
    .getByRole('button', { name: 'Transformar valor em variável', exact: true })
    .click();
  await expect(
    page.getByRole('combobox', {
      name: 'Escolha a coluna do dataset',
      exact: true,
    }),
  ).toBeFocused();
});

test('step de variável informa massa vazia e depois digita no campo focado', async () => {
  await arrange();
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { useRecorderStore } = await load(
      '/src/entities/recorder/model/store.ts',
    );
    const { useDatasetStore } = await load(
      '/src/entities/dataset/model/store.ts',
    );
    useDatasetStore.setState({
      currentName: 'Padrão',
      columns: ['agencia'],
      rows: [{ agencia: '' }],
      activeRowIndex: 0,
    });
    useRecorderStore.setState({
      steps: [
        {
          id: 24,
          type: 'inputText',
          label: 'Digitar {{agencia}}',
          value: '{{agencia}}',
          time: '--:--',
          selected: false,
          selectors: [],
        },
      ],
    });
    (
      window as unknown as { recorderFixture: { hierarchy: string } }
    ).recorderFixture.hierarchy =
      '<hierarchy><node package="com.test" resource-id="com.test:id/editText" class="android.widget.EditText" focused="true" bounds="[0,0][100,100]"/></hierarchy>';
  });
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__item-error')).toContainText(
    'Variável {{agencia}} sem valor na massa ativa #1',
  );
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { recorderFixture: { commands: string[][] } }
      ).recorderFixture.commands.filter((a) => a[0] === 'input'),
    ),
  ).toHaveLength(0);
  await page.evaluate(async () => {
    const path = '/src/entities/dataset/model/store.ts';
    const { useDatasetStore } = await import(path);
    useDatasetStore.getState().setCell(0, 'agencia', '4321');
  });
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 1 step.',
  );
  await expect(page.locator('.steps-panel__item-error')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { recorderFixture: { commands: string[][] } }
      ).recorderFixture.commands.filter((a) => a[0] === 'input'),
    ),
  ).toEqual([['input', 'text', '4321']]);
});

test('delay máximo é antecipado quando a próxima tela fica pronta', async () => {
  await arrange(8_000);
  const started = Date.now();
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 2 steps.',
    { timeout: 10_000 },
  );
  expect(Date.now() - started).toBeLessThan(6_000);
  await expect(page.locator('.steps-panel__result--passed')).toHaveCount(2);
});

test('delay máximo é antecipado quando o próximo botão aparece estável', async () => {
  await arrange(8_000);
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    useRecorderStore.setState({
      steps: [
        {
          id: 1,
          type: 'launchApp',
          label: 'Abrir app',
          value: 'com.test.bank',
          time: '--:--',
          selected: false,
          selectors: [],
          delayAfterMs: 8_000,
        },
        {
          id: 2,
          type: 'tap',
          label: 'Toque em login',
          time: '--:--',
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/login',
              stability: 'stable',
            },
          ],
        },
      ],
    });
  });
  const started = Date.now();
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 2 steps.',
    { timeout: 10_000 },
  );
  expect(Date.now() - started).toBeLessThan(6_000);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { recorderFixture: { commands: string[][] } }
      ).recorderFixture.commands.filter((a) => a[0] === 'input'),
    ),
  ).toEqual([['input', 'tap', '50', '50']]);
});

test('terceiro step encontra account_info_container após dump transitório vazio', async () => {
  await arrange();
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    const fixture = (
      window as unknown as {
        recorderFixture: { hierarchy: string; emptyAfterInput: boolean };
      }
    ).recorderFixture;
    fixture.hierarchy =
      '<hierarchy><node package="com.test" resource-id="com.test:id/login" class="android.widget.Button" bounds="[0,0][100,100]"/><node package="com.test" resource-id="com.test:id/account_info_container" class="android.widget.Button" bounds="[200,200][300,300]"/></hierarchy>';
    fixture.emptyAfterInput = true;
    useRecorderStore.setState({
      steps: [
        {
          id: 1,
          type: 'launchApp',
          label: 'Abrir app',
          value: 'com.test.bank',
          time: '--:--',
          selected: false,
          selectors: [],
        },
        {
          id: 2,
          type: 'tap',
          label: 'Toque em login',
          time: '--:--',
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/login',
              stability: 'stable',
            },
          ],
        },
        {
          id: 3,
          type: 'tap',
          label: 'Toque em account_info_container',
          time: '--:--',
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/account_info_container',
              stability: 'stable',
            },
          ],
        },
      ],
    });
  });
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 3 steps.',
  );
  await expect(page.locator('.steps-panel__result--passed')).toHaveCount(3);
  const commands = await page.evaluate(
    () =>
      (window as unknown as { recorderFixture: { commands: string[][] } })
        .recorderFixture.commands,
  );
  expect(
    commands.filter(
      (args) => args[0] === 'uiautomator' && args.includes('--verbose'),
    ),
  ).toHaveLength(1);
  expect(commands.filter((args) => args[0] === 'input')).toEqual([
    ['input', 'tap', '50', '50'],
    ['input', 'tap', '250', '250'],
  ]);
});

test('accordion por teclado mostra seletores e JSON acompanha timeout e seleção', async () => {
  await arrange();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const accordion = page.getByRole('button', {
    name: 'Expandir step 8: Abrir Home',
    exact: true,
  });
  await accordion.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', {
      name: 'Recolher step 8: Abrir Home',
      exact: true,
    }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#step-details-8')).toContainText(
    'com.test:id/login',
  );
  const timeout = page.getByRole('spinbutton', {
    name: 'Timeout do step 8, em segundos',
  });
  await timeout.fill('2.5');
  await page
    .getByRole('button', { name: 'Mostrar código', exact: true })
    .click();
  const json = page.getByRole('textbox', { name: 'JSON da gravação' });
  expect(JSON.parse(await json.inputValue()).steps[0].timeoutMs).toBe(2500);
  await page
    .getByRole('combobox', { name: 'Escopo do JSON' })
    .selectOption('step');
  expect(JSON.parse(await json.inputValue())).toMatchObject({
    type: 'tap',
    timeoutMs: 2500,
    index: 0,
  });
  await page.getByRole('button', { name: 'Copiar JSON exibido' }).click();
  await expect(page.locator('.recording-code')).toContainText('Copiado');
  const copied = await electron.evaluate(({ clipboard }) =>
    clipboard.readText(),
  );
  expect(JSON.parse(copied).timeoutMs).toBe(2500);
  await timeout.fill('0');
  await expect(timeout).toHaveAttribute('aria-invalid', 'true');
  expect(JSON.parse(await json.inputValue()).timeoutMs).toBe(2500);
  await timeout.fill('');
  expect(JSON.parse(await json.inputValue()).timeoutMs).toBeUndefined();
  await page
    .getByRole('button', { name: 'Expandir todos', exact: true })
    .click();
  await expect(page.locator('.step-details')).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Recolher todos', exact: true })
    .click();
  await expect(page.locator('.step-details')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('reconhecimento captura miniatura do canvas simulado e preserva evidência só na sessão', async () => {
  await arrange();
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { useRecorderStore } = await load(
      '/src/entities/recorder/model/store.ts',
    );
    const { useDeviceStore } = await load(
      '/src/entities/device/model/store.ts',
    );
    const { setSnapshotSource } = await load(
      '/src/shared/lib/device-snapshot/index.ts',
    );
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 2400;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#162032';
    ctx.fillRect(0, 0, 1080, 2400);
    ctx.fillStyle = '#ffffff';
    ctx.font = '64px sans-serif';
    ctx.fillText('Device simulado', 60, 180);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(60, 380, 960, 180);
    ctx.fillStyle = '#101010';
    ctx.fillText('Continuar', 220, 500);
    useRecorderStore.setState({ steps: [], inspectorOpen: false });
    useDeviceStore.setState({ status: 'streaming' });
    setSnapshotSource(() => canvas);
  });
  await page
    .getByRole('button', { name: 'Iniciar gravação', exact: true })
    .click();
  const thumb = page.getByRole('button', { name: 'Ampliar captura do step 1' });
  await expect(thumb).toBeVisible({ timeout: 10_000 });
  await page
    .getByRole('button', { name: 'Finalizar gravação', exact: true })
    .click();
  await thumb.click();
  const preview = page.getByRole('dialog', { name: 'Captura do step 1' });
  await expect(preview).toBeVisible();
  await expect(
    preview.getByRole('link', { name: 'Baixar imagem' }),
  ).toHaveAttribute('download', 'flowtest-tela-step-1.jpg');
  const dimensions = await preview
    .locator('img')
    .evaluate((img: HTMLImageElement) => ({
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));
  expect(dimensions).toEqual({ width: 324, height: 720 });
  await page.keyboard.press('Escape');
  await expect(preview).toHaveCount(0);
  await expect(thumb).toBeFocused();
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    const store = useRecorderStore.getState();
    const screen = store.steps[0];
    const tap = {
      ...screen,
      type: 'tap',
      screenSignature: undefined,
      pending: false,
    };
    useRecorderStore.setState({
      steps: [
        {
          ...screen,
          label: 'Tela inicial',
          screenSignature: {
            ...screen.screenSignature,
            anchors: [{ type: 'text', value: 'Boas-vindas' }],
          },
        },
        { ...tap, id: 2, label: 'Botão "Entrar"', delayAfterMs: 1500 },
        {
          ...tap,
          id: 3,
          type: 'inputText',
          label: 'Digitar {{agencia}}',
          value: '{{agencia}}',
          delayAfterMs: 2000,
        },
        {
          ...screen,
          id: 4,
          label: 'Tela da conta',
          screenSignature: {
            ...screen.screenSignature,
            anchors: [{ type: 'text', value: 'Minha conta' }],
          },
        },
        { ...tap, id: 5, label: 'Botão "Continuar"', delayAfterMs: 500 },
        { ...tap, id: 6, label: 'Botão "Confirmar"', delayAfterMs: 0 },
      ],
    });
    store.setScreenshot(4, store.screenshots[screen.id]);
  });
  await page
    .locator('.steps-panel')
    .screenshot({ path: 'artifacts/recorder-minimal-timeline.png' });
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    for (const step of useRecorderStore.getState().steps.slice(1))
      useRecorderStore.getState().removeStep(step.id);
  });
  await page.getByRole('button', { name: /^Expandir step 1:/ }).click();
  await page
    .getByRole('button', { name: 'Mostrar código', exact: true })
    .click();
  await page.screenshot({ path: 'artifacts/recorder-inspection.png' });
  const saved = await page.evaluate(() =>
    localStorage.getItem('flowtest.recorder.v1'),
  );
  expect(saved).not.toContain('data:image');
  expect(
    await page.getByRole('textbox', { name: 'JSON da gravação' }).inputValue(),
  ).not.toContain('data:image');
  await page.reload();
  await expect(page.getByText('Sem captura', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Ampliar captura do step 1' }),
  ).toHaveCount(0);
});

test('captura reconhece mudança de tela nativa com IDs iguais e separa os grupos', async () => {
  await arrange();
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { useRecorderStore } = await load(
      '/src/entities/recorder/model/store.ts',
    );
    const { useDeviceStore } = await load(
      '/src/entities/device/model/store.ts',
    );
    useRecorderStore.setState({ steps: [] });
    useDeviceStore.setState({ status: 'streaming' });
    (
      window as unknown as { recorderFixture: { hierarchy: string } }
    ).recorderFixture.hierarchy =
      '<hierarchy><node package="com.test" resource-id="com.test:id/title" text="Entrar com CPF" class="android.widget.TextView" bounds="[0,0][100,30]"/><node package="com.test" resource-id="com.test:id/action" text="Continuar" class="android.widget.Button" bounds="[0,40][100,80]"/></hierarchy>';
  });
  await page
    .getByRole('button', { name: 'Iniciar gravação', exact: true })
    .click();
  await expect(page.locator('.steps-panel__scene--screen')).toHaveCount(1, {
    timeout: 10_000,
  });
  await page.evaluate(() => {
    (
      window as unknown as { recorderFixture: { hierarchy: string } }
    ).recorderFixture.hierarchy =
      '<hierarchy><node package="com.test" resource-id="com.test:id/title" text="Minha conta" class="android.widget.TextView" bounds="[0,0][100,30]"/><node package="com.test" resource-id="com.test:id/action" text="Continuar" class="android.widget.Button" bounds="[0,40][100,80]"/></hierarchy>';
  });
  await expect(page.locator('.steps-panel__scene--screen')).toHaveCount(2, {
    timeout: 10_000,
  });
  await expect(
    page.locator('.steps-panel__scene--screen').last(),
  ).toContainText('Minha conta');
  await expect(page.locator('.inspector-panel')).toContainText('Minha conta');
  await expect(page.locator('.inspector-panel')).not.toContainText(
    'android.widget.Application',
  );
  await expect(page.locator('.steps-panel__scene--screen').last()).toHaveCSS(
    'border-top-width',
    '1px',
  );
  await page
    .getByRole('button', { name: 'Finalizar gravação', exact: true })
    .click();
});

test('alça visível reordena steps e checkbox seleciona para ações em lote', async () => {
  await arrange();
  const handle = page.getByRole('button', {
    name: 'Arrastar para reordenar step 8',
  });
  const checkbox = page.getByRole('checkbox', { name: 'Selecionar step 8' });
  await expect(handle).toBeVisible();
  await expect(checkbox).toBeVisible();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await handle.dragTo(page.locator('.steps-panel__item').last());
  await expect(page.locator('.steps-panel__item').last()).toHaveAttribute(
    'aria-label',
    /Step 8:/,
  );
});

test('teclado de senha dinâmica substitui toques e relê pares a cada dígito', async () => {
  await arrange();
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { useRecorderStore } = await load(
      '/src/entities/recorder/model/store.ts',
    );
    const { useDatasetStore } = await load(
      '/src/entities/dataset/model/store.ts',
    );
    const { screenSignature } = await load(
      '/src/shared/lib/screen-signature/index.ts',
    );
    const { parseUiDump } = await load('/src/shared/lib/ui-hierarchy/index.ts');
    const fixture = (
      window as unknown as {
        recorderFixture: {
          hierarchy: string;
          onInput: (args: string[]) => void;
          commands: string[][];
        };
      }
    ).recorderFixture;
    const pairs = ['0 ou 1', '2 ou 3', '4 ou 5', '6 ou 7', '8 ou 9'];
    const render = () =>
      `<hierarchy><node package="com.test" resource-id="com.test:id/header" text="Digite a senha de acesso" bounds="[0,0][500,30]"/><node package="com.test" resource-id="com.test:id/btns_keyboard" bounds="[0,0][500,100]"/>${pairs.map((text, index) => `<node package="com.test" resource-id="com.test:id/btn${index + 1}" text="${text}" class="android.widget.Button" bounds="[${index * 100},0][${(index + 1) * 100},100]"/>`).join('')}<node package="com.test" resource-id="com.test:id/continue" text="Continuar" class="android.widget.Button" bounds="[600,0][700,100]"/></hierarchy>`;
    fixture.hierarchy = render();
    fixture.onInput = (args) => {
      if (args[0] === 'input' && args[1] === 'tap' && Number(args[2]) < 500) {
        pairs.push(pairs.shift()!);
        fixture.hierarchy = render();
      }
    };
    useDatasetStore.setState({
      columns: ['senha'],
      rows: [{ senha: '1010' }],
      activeRowIndex: 0,
    });
    const signature = screenSignature(parseUiDump(fixture.hierarchy));
    useRecorderStore.setState({
      steps: [
        {
          id: 1,
          type: 'waitForPage',
          label: 'Reconhecer senha',
          value: 'com.test',
          time: '00:01',
          selected: false,
          selectors: [],
          screenSignature: signature,
          delayAfterMs: 0,
        },
        {
          id: 2,
          type: 'tap',
          label: 'Toque no teclado',
          time: '00:02',
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/btn1',
              stability: 'stable',
            },
            { type: 'text', value: '0 ou 1', stability: 'medium' },
          ],
        },
        {
          id: 3,
          type: 'tap',
          label: 'Não identificado',
          time: '00:03',
          selected: false,
          selectors: [],
        },
        {
          id: 4,
          type: 'tap',
          label: 'Não identificado',
          time: '00:04',
          selected: false,
          selectors: [],
        },
        {
          id: 5,
          type: 'tap',
          label: 'Continuar',
          time: '00:05',
          selected: false,
          selectors: [
            {
              type: 'resourceId',
              value: 'com.test:id/continue',
              stability: 'stable',
            },
            { type: 'text', value: 'Continuar', stability: 'medium' },
          ],
        },
      ],
    });
  });
  await page.getByRole('button', { name: /^Expandir step 1:/ }).click();
  await expect(page.locator('.step-details__keypad')).toContainText(
    '3 toques consecutivos',
  );
  await page
    .getByRole('combobox', { name: 'Coluna da senha do teclado dinâmico' })
    .selectOption('senha');
  await page
    .getByRole('button', { name: 'Substituir toques por step de senha' })
    .click();
  await expect(page.locator('.steps-panel__item')).toHaveCount(3);
  await expect(page.locator('.steps-panel__item').nth(1)).toContainText(
    '{{senha}}',
  );
  await expect(
    page.getByRole('combobox', { name: 'Coluna da senha do step 6' }),
  ).toHaveValue('senha');
  await page
    .locator('.steps-panel')
    .screenshot({ path: 'artifacts/recorder-secure-keypad.png' });
  await page.getByRole('button', { name: 'Executar steps' }).click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Concluído — 3 steps',
    { timeout: 20_000 },
  );
  const taps = await page.evaluate(() =>
    (
      window as unknown as { recorderFixture: { commands: string[][] } }
    ).recorderFixture.commands
      .filter((args) => args[0] === 'input' && args[1] === 'tap')
      .map((args) => Number(args[2])),
  );
  expect(taps).toEqual([50, 450, 350, 250, 650]);
  await page.getByRole('button', { name: 'Mostrar código' }).click();
  const json = await page
    .getByRole('textbox', { name: 'JSON da gravação' })
    .inputValue();
  expect(json).toContain('"value": "{{senha}}"');
  expect(json).not.toContain('"value": "1010"');
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { useDatasetStore } = await load(
      '/src/entities/dataset/model/store.ts',
    );
    useDatasetStore.getState().setCell(0, 'senha', '12a0');
    (
      window as unknown as { recorderFixture: { commands: string[][] } }
    ).recorderFixture.commands = [];
  });
  await page.getByRole('button', { name: 'Executar steps' }).click();
  await expect(page.locator('.steps-panel__run-info')).toContainText('Falha', {
    timeout: 10_000,
  });
  await expect(page.locator('.steps-panel__run-info')).not.toContainText(
    '12a0',
  );
  const failedRunTaps = await page.evaluate(() =>
    (
      window as unknown as { recorderFixture: { commands: string[][] } }
    ).recorderFixture.commands.filter(
      (args) => args[0] === 'input' && args[1] === 'tap',
    ),
  );
  expect(failedRunTaps).toEqual([]);
});

test('timeout configurado encerra abertura travada sem executar o próximo step', async () => {
  await arrange();
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    useRecorderStore.getState().updateStep(8, {
      type: 'launchApp',
      value: 'com.test',
      label: 'Abrir app',
      timeoutMs: 1000,
    });
    (
      window as unknown as { recorderFixture: { holdLaunch: boolean } }
    ).recorderFixture.holdLaunch = true;
  });
  await page
    .getByRole('button', { name: 'Executar steps', exact: true })
    .click();
  await expect(page.locator('.steps-panel__run-info')).toContainText(
    'Timeout: o step excedeu 1 s.',
  );
  await expect(page.locator('.steps-panel__item[data-run-status]')).toHaveCount(
    1,
  );
});

test('salvar step como bloco abre Flows com snapshot persistido e variáveis', async () => {
  await arrange();
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    const { useRecorderStore } = await import(path);
    useRecorderStore.getState().updateStep(8, {
      type: 'inputText',
      value: '{{agencia}}',
      label: 'Digitar agência',
      timeoutMs: 4000,
    });
  });
  await page
    .getByRole('button', {
      name: 'Expandir step 8: Digitar agência',
      exact: true,
    })
    .click();
  await page
    .getByRole('button', { name: 'Salvar este step como bloco' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Salvar bloco em Flows' });
  await expect(dialog).toContainText('1 step configurado');
  await dialog
    .getByRole('textbox', { name: 'Nome do bloco' })
    .fill('Informar agência');
  await dialog.getByRole('button', { name: 'Salvar e abrir Flows' }).click();
  await expect(page).toHaveURL(/flows\?bloco=action_/);
  await expect(
    page.getByRole('heading', { name: 'Informar agência' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Informar agência/ }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.propriedades-panel')).toContainText(
    '{{agencia}}',
  );
  await page.locator('.canvas-panel__saved-steps summary').click();
  await expect(page.locator('.canvas-panel__saved-steps')).toContainText(
    'Timeout: 4 s',
  );
  await page.evaluate(async () => {
    const path = '/src/entities/recorder/model/store.ts';
    (await import(path)).useRecorderStore
      .getState()
      .updateStep(8, { value: 'alterado' });
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Informar agência' }),
  ).toBeVisible();
  await page.locator('.canvas-panel__saved-steps summary').click();
  await expect(page.locator('.canvas-panel__saved-steps')).toContainText(
    '{{agencia}}',
  );
  await expect(page.locator('.canvas-panel__saved-steps li')).toHaveCount(1);
  await page.screenshot({ path: 'artifacts/flows-saved-block.png' });
});

test('salvar bloco da lista inclui todos os steps e relata falha de persistência', async () => {
  await arrange();
  await page.getByRole('button', { name: 'Salvar bloco', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Salvar bloco em Flows' });
  await expect(dialog).toContainText('2 steps configurados');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'flowtest.actions.v1')
        throw new DOMException('Full', 'QuotaExceededError');
      original.call(this, key, value);
    };
    Object.assign(window, {
      restoreStorage: () => {
        Storage.prototype.setItem = original;
      },
    });
  });
  await dialog.getByRole('button', { name: 'Salvar e abrir Flows' }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'Não foi possível salvar',
  );
  await expect(page).not.toHaveURL(/flows/);
  await page.evaluate(() =>
    (window as unknown as { restoreStorage: () => void }).restoreStorage(),
  );
  await dialog
    .getByRole('textbox', { name: 'Nome do bloco' })
    .fill('Fluxo completo');
  await dialog.getByRole('button', { name: 'Salvar e abrir Flows' }).click();
  await expect(
    page.getByRole('heading', { name: 'Fluxo completo' }),
  ).toBeVisible();
  await expect(page.locator('.canvas-panel__saved-steps li')).toHaveCount(2);
});

test('voltar da etapa salvar preserva gravação e salvamento existente abre o bloco em Flows', async () => {
  await arrange();
  await page.getByRole('button', { name: /Fase 2:/ }).click();
  await page.getByRole('button', { name: /Fase 1:/ }).click();
  await expect(page.locator('.steps-panel__item')).toHaveCount(2);
  await page.getByRole('button', { name: /Fase 2:/ }).click();
  await page
    .getByRole('textbox', { name: 'Nome da Action' })
    .fill('Sequência pelo Inspector');
  await page
    .getByRole('button', { name: 'Salvar Action', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Sequência pelo Inspector' }),
  ).toBeVisible();
  await expect(page.locator('.canvas-panel__saved-steps li')).toHaveCount(2);
});
