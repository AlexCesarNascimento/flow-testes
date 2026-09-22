import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const [name, tool, input = '{}'] = process.argv.slice(2);
const servers = JSON.parse(readFileSync('.mcp.json', 'utf8')).mcpServers;
const server = servers[name];
if (!server) throw new Error('Servidor não configurado');
const client = new Client({ name: 'flowtest-smoke', version: '1.0.0' });
const transport = server.url
  ? new StreamableHTTPClientTransport(new URL(server.url), {
      requestInit: { headers: server.headers },
    })
  : new StdioClientTransport({
      command: server.command,
      args: server.args,
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(
            (entry): entry is [string, string] => entry[1] !== undefined,
          ),
        ),
        ...server.env,
      },
      stderr: 'pipe',
    });
try {
  await client.connect(transport, { timeout: 45000 });
  const list = await client.listTools();
  console.log(
    JSON.stringify({
      server: name,
      tools: list.tools.map((t) => ({
        name: t.name,
        inputSchema: t.inputSchema,
      })),
    }),
  );
  if (tool) {
    const result = await client.callTool(
      { name: tool, arguments: JSON.parse(input) },
      undefined,
      { timeout: 60000 },
    );
    console.log(JSON.stringify(result).slice(0, 6000));
    if (result.isError) process.exitCode = 1;
  }
} catch (error) {
  // Não imprimir headers, variáveis de ambiente ou objetos de credenciais.
  console.error(error instanceof Error ? error.message : 'Falha MCP');
  process.exitCode = 1;
} finally {
  await client.close();
}
