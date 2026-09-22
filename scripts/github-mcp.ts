import { spawnSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const binary = '.cache/github-mcp/github-mcp-server';
if (!existsSync(binary))
  throw new Error(
    'Execute node scripts/setup-github-mcp.ts antes de iniciar o MCP',
  );
let token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
if (!token) {
  const result = spawnSync(
    'gh',
    ['auth', 'token', '--hostname', 'github.com'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  if (result.status === 0) token = result.stdout.trim();
}
if (!token) {
  console.error(
    'GitHub MCP: autentique com gh auth login --hostname github.com --web. Nenhum token foi salvo pelo projeto.',
  );
  process.exit(1);
}
// O token passa apenas pelo ambiente do processo filho, nunca por argv ou arquivo.
const child = spawn(
  binary,
  ['stdio', '--toolsets', 'repos,issues,pull_requests,actions,context'],
  {
    stdio: 'inherit',
    env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: token },
  },
);
child.on('error', () => {
  console.error('Falha ao iniciar GitHub MCP');
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => child.kill(signal));
