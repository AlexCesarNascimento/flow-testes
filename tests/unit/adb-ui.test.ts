import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Adb } from '@yume-chan/adb';
import {
  adbCommand,
  readUiDump,
} from '../../src/renderer/src/shared/lib/adb-ui/index.ts';

function fakeAdb(response: (args: string[]) => string | null) {
  const commands: string[][] = [];
  const releases: Array<(text: string) => void> = [];
  let kills = 0;
  const adb = {
    subprocess: {
      noneProtocol: {
        spawn: async (args: string[]) => {
          commands.push(args);
          let controller: ReadableStreamDefaultController<Uint8Array>;
          let closed = false;
          const output = new ReadableStream<Uint8Array>({
            start(c) {
              controller = c;
            },
          });
          const text = response(args);
          if (text !== null) {
            controller!.enqueue(new TextEncoder().encode(text));
            controller!.close();
            closed = true;
          } else {
            releases.push((value) => {
              if (closed) return;
              controller!.enqueue(new TextEncoder().encode(value));
              controller!.close();
              closed = true;
            });
          }
          return {
            output,
            kill: async () => {
              kills++;
              if (!closed) {
                controller.close();
                closed = true;
              }
            },
          };
        },
      },
    },
  } as unknown as Adb;
  return { adb, commands, releases, kills: () => kills };
}

test('timeout e cancelamento encerram leitura do comando remoto', async () => {
  const timed = fakeAdb(() => null);
  await assert.rejects(
    adbCommand(timed.adb, ['uiautomator'], undefined, 5),
    /Tempo limite/,
  );
  assert.ok(timed.kills() > 0);
  const cancelled = fakeAdb(() => null);
  const abort = new AbortController();
  const running = adbCommand(cancelled.adb, ['uiautomator'], abort.signal);
  abort.abort();
  await assert.rejects(running, { name: 'AbortError' });
  assert.ok(cancelled.kills() > 0);
});

test('falha no dump não lê XML antigo e remove somente o arquivo da própria leitura', async () => {
  const fixture = fakeAdb((args) =>
    args[0] === 'uiautomator' ? 'ERROR: could not get idle state' : '',
  );
  await assert.rejects(readUiDump(fixture.adb), /recusou/);
  assert.equal(
    fixture.commands.some((args) => args[0] === 'cat'),
    false,
  );
  const dump = fixture.commands.find((args) => args[0] === 'uiautomator')!;
  assert.deepEqual(
    fixture.commands.find((args) => args[0] === 'rm'),
    ['rm', '-f', dump[2]],
  );
});

test('texto error dentro da tela é conteúdo válido, não falha de comando', async () => {
  const xml = '<hierarchy><node text="error"/></hierarchy>';
  const fixture = fakeAdb((args) => (args[0] === 'cat' ? xml : ''));
  assert.equal(await readUiDump(fixture.adb), xml);
});

test('dump padrão sem nodes tenta modo detalhado antes de declarar hierarquia indisponível', async () => {
  const valid =
    '<hierarchy rotation="0"><node resource-id="com.test:id/account_info_container" bounds="[0,0][10,10]"/></hierarchy>';
  let cats = 0;
  const fixture = fakeAdb((args) =>
    args[0] === 'cat'
      ? ++cats === 1
        ? '<hierarchy rotation="0"/>'
        : valid
      : '',
  );
  assert.equal(await readUiDump(fixture.adb), valid);
  const dumps = fixture.commands.filter((args) => args[0] === 'uiautomator');
  assert.equal(dumps.length, 2);
  assert.deepEqual(dumps[1].slice(0, 3), ['uiautomator', 'dump', '--verbose']);
});

test('dois leitores do mesmo device não iniciam dumps concorrentes', async () => {
  const xml = '<hierarchy><node bounds="[0,0][10,10]"/></hierarchy>';
  let firstDump = true;
  const fixture = fakeAdb((args) => {
    if (args[0] === 'uiautomator' && firstDump) {
      firstDump = false;
      return null;
    }
    return args[0] === 'cat' ? xml : 'UI hierarchy dumped to file';
  });
  const first = readUiDump(fixture.adb);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const second = readUiDump(fixture.adb);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(
    fixture.commands.filter((args) => args[0] === 'uiautomator').length,
    1,
  );
  fixture.releases[0]('UI hierarchy dumped to file');
  assert.deepEqual(await Promise.all([first, second]), [xml, xml]);
  assert.equal(
    fixture.commands.filter((args) => args[0] === 'uiautomator').length,
    2,
  );
});

test('dump normal e detalhado vazios falham sem reutilizar arquivo anterior', async () => {
  const fixture = fakeAdb((args) =>
    args[0] === 'cat'
      ? '<hierarchy rotation="0"/>'
      : 'UI hierarchy dumped to file',
  );
  await assert.rejects(readUiDump(fixture.adb), /normal e detalhado/);
  const dumps = fixture.commands.filter((args) => args[0] === 'uiautomator');
  const removed = fixture.commands.filter((args) => args[0] === 'rm');
  assert.equal(dumps.length, 2);
  assert.notEqual(dumps[0][2], dumps[1][3]);
  assert.deepEqual(
    removed.map((args) => args[2]),
    [dumps[0][2], dumps[1][3]],
  );
});

test('erro de transporte no fallback detalhado não é tratado como árvore vazia', async () => {
  const fixture = fakeAdb((args) => {
    if (args[0] === 'cat') return '<hierarchy rotation="0"/>';
    if (args.includes('--verbose')) return 'ERROR: device disconnected';
    return 'UI hierarchy dumped to file';
  });
  await assert.rejects(readUiDump(fixture.adb), /recusou/);
});
