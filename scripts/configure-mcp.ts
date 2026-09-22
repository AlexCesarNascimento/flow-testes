import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

type Server = {
  type?: string;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
};
const servers: Record<string, Server> = JSON.parse(
  readFileSync('scripts/mcp-servers.json', 'utf8'),
);
const claude = existsSync('.mcp.json')
  ? JSON.parse(readFileSync('.mcp.json', 'utf8'))
  : { mcpServers: {} };
claude.mcpServers ??= {};
let codex = existsSync('.codex/config.toml')
  ? readFileSync('.codex/config.toml', 'utf8')
  : '# MCPs locais do FlowTest. Gerenciados por scripts/configure-mcp.ts.\n';
for (const [name, server] of Object.entries(servers)) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Nome de servidor inválido');
  if (
    claude.mcpServers[name] &&
    JSON.stringify(claude.mcpServers[name]) !== JSON.stringify(server)
  )
    throw new Error(
      `Claude: configuração existente difere para ${name}; revisar manualmente.`,
    );
  const lines = [`[mcp_servers.${name}]`];
  for (const key of ['url', 'command', 'args'] as const)
    if (server[key]) lines.push(`${key} = ${JSON.stringify(server[key])}`);
  lines.push('startup_timeout_sec = 45');
  for (const [key, values] of [
    ['env', server.env],
    ['http_headers', server.headers],
  ] as const) {
    if (values) {
      lines.push(`[mcp_servers.${name}.${key}]`);
      for (const [k, v] of Object.entries(values))
        lines.push(`${JSON.stringify(k)} = ${JSON.stringify(v)}`);
    }
  }
  const block = lines.join('\n');
  if (codex.includes(`[mcp_servers.${name}]`)) {
    if (!codex.includes(block))
      throw new Error(
        `Codex: configuração existente difere para ${name}; revisar manualmente.`,
      );
  } else codex += `\n${block}\n`;
  claude.mcpServers[name] = server;
}
// Verificar todos os conflitos antes de escrever qualquer configuração.
mkdirSync('.codex', { recursive: true });
writeFileSync('.codex/config.toml', codex);
writeFileSync('.mcp.json', `${JSON.stringify(claude, null, 2)}\n`);
console.log('MCPs locais configurados:', Object.keys(servers).join(', '));
