import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Release oficial, checksum do asset publicado pelo GitHub. Atualizar em conjunto.
const version = '1.12.2';
const sha256 =
  '7e6c5aec43f26b82d3580e77a4ee26872bcd34b48c9a08d0eaef48b5d0563904';
if (process.platform !== 'darwin' || process.arch !== 'arm64')
  throw new Error(
    'Instalador auditado para macOS ARM64; selecionar asset oficial e checksum para outra plataforma.',
  );
const url = `https://github.com/github/github-mcp-server/releases/download/v${version}/github-mcp-server_Darwin_arm64.tar.gz`;
const response = await fetch(url);
if (!response.ok) throw new Error(`Download falhou: HTTP ${response.status}`);
const archive = Buffer.from(await response.arrayBuffer());
if (createHash('sha256').update(archive).digest('hex') !== sha256)
  throw new Error('Checksum divergente; instalação cancelada');
mkdirSync('.cache/github-mcp', { recursive: true });
writeFileSync('.cache/github-mcp/release.tar.gz', archive);
const extracted = spawnSync(
  'tar',
  [
    '-xzf',
    '.cache/github-mcp/release.tar.gz',
    '-C',
    '.cache/github-mcp',
    'github-mcp-server',
  ],
  { stdio: 'inherit' },
);
if (extracted.status !== 0) throw new Error('Falha ao extrair binário');
chmodSync('.cache/github-mcp/github-mcp-server', 0o755);
console.log(
  `GitHub MCP ${version}: SHA-256 verificado e instalado em .cache/github-mcp`,
);
