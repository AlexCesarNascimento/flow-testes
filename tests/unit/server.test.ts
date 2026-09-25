import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../scripts/serve-prototype.ts',
);

test(
  'servidor entrega o protótipo e não expõe arquivos internos',
  { timeout: 15000 },
  async () => {
    const child = spawn(process.execPath, [SCRIPT], {
      env: { ...process.env, FLOWTEST_PORT: '4174' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    try {
      await Promise.race([
        once(child.stdout!, 'data'),
        once(child, 'exit').then(() => {
          throw new Error('Servidor encerrou antes de iniciar');
        }),
      ]);
      const root = await fetch('http://127.0.0.1:4174');
      assert.equal(root.status, 200);
      assert.match(await root.text(), /<html/i);
      for (const path of [
        '/.env',
        '/.git/config',
        '/.claude/settings.local.json',
        '/package.json',
        '/%2e%2e/.env',
      ]) {
        assert.equal((await fetch(`http://127.0.0.1:4174${path}`)).status, 404);
      }
      assert.equal(
        (await fetch('http://127.0.0.1:4174', { method: 'POST' })).status,
        405,
      );
      const head = await fetch('http://127.0.0.1:4174', { method: 'HEAD' });
      assert.equal(head.status, 200);
      assert.equal(await head.text(), '');
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const exit = once(child, 'exit');
        child.kill('SIGTERM');
        await exit;
      }
    }
  },
);
