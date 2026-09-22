import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const requirePlaywright = createRequire(
  new URL('../node_modules/@playwright/mcp/package.json', import.meta.url),
);
const { chromium } = requirePlaywright(
  'playwright',
) as typeof import('playwright');
const args = [
  'node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js',
  '--no-usage-statistics',
  '--no-performance-crux',
  '--isolated',
  '--headless',
  '--no-page-id-routing',
  '--redact-network-headers',
];
if (process.argv.includes('--electron')) {
  // Conexão apenas; nunca inicia ou altera um build Electron.
  const endpoint = 'http://127.0.0.1:9222';
  const response = await fetch(`${endpoint}/json/version`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error('CDP Electron não disponível no loopback');
  args.push('--browser-url', endpoint);
} else {
  const browser = chromium.executablePath();
  if (!existsSync(browser))
    throw new Error(
      'Execute node node_modules/@playwright/mcp/cli.js install-browser chrome-for-testing',
    );
  args.push('--executable-path', browser);
}
const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: { ...process.env, CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS: '1' },
});
child.on('error', () => {
  console.error('Falha ao iniciar Chrome DevTools MCP');
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => child.kill(signal));
