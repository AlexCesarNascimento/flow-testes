import { createServer } from 'node:http';
import { access, readFile } from 'node:fs/promises';

// Servir apenas o protótipo: nunca expor configs, .git ou secrets por HTTP.
// Candidatos em ordem de preferência — do mais organizado ao legado
const candidates = [
  new URL('../proto/protótipo clicável.html', import.meta.url),
  new URL(
    '../proto/Design – 00 · FlowTest — protótipo clicável.html',
    import.meta.url,
  ),
  new URL(
    '../Design – 00 · FlowTest — protótipo clicável.html',
    import.meta.url,
  ),
];
const file = await (async () => {
  for (const candidate of candidates) {
    if (
      await access(candidate)
        .then(() => true)
        .catch(() => false)
    )
      return candidate;
  }
  throw new Error(
    'Arquivo do protótipo não encontrado em nenhum dos caminhos esperados',
  );
})();
const port = Number(process.env.FLOWTEST_PORT ?? 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Porta inválida');
const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end();
    return;
  }
  if (request.url === '/favicon.ico') {
    response.writeHead(204).end();
    return;
  }
  if (request.url !== '/' && request.url !== '/index.html') {
    response.writeHead(404).end('Não encontrado');
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (err) {
    console.error('[serve-prototype] falha ao ler arquivo:', err);
    response.writeHead(500).end('Não foi possível ler o protótipo');
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`FlowTest: http://127.0.0.1:${port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => server.close(() => process.exit(0)));
