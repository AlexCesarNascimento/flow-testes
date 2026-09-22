# Plano de preparação do ambiente

## Escopo e método

Preparar MCPs, Skills, Hooks e scripts compartilhados para Codex CLI e Claude Code, com verificações reais. Executar uma etapa por vez e criar commits semânticos pequenos após validação e revisão. Preservar o protótipo e alterações preexistentes.

Há uma decisão de escopo pendente: criar a base executável React + TypeScript + Electron nesta entrega ou preparar apenas o protótipo atual. As validações de main, preload, IPC, build e CDP Electron dependem de uma aplicação executável.

## Inventário inicial — 2026-09-22

| Item | Encontrado |
| --- | --- |
| Sistema | macOS 26.6.2, Darwin 25.6.0, ARM64 |
| Node.js | 25.9.0 |
| npm / npx | 11.12.1 |
| Git | 2.54.0 (Apple Git-157) |
| GitHub CLI | 2.93.0 |
| Codex CLI | 0.155.1 |
| Claude Code | 2.1.122 |
| Electron / TypeScript / ESLint / Prettier / Playwright | Sem instalação local no projeto; executáveis não encontrados no PATH |
| Projeto | Protótipo HTML; sem package.json, src, configurações de build ou testes |
| Remoto | https://github.com/AlexCesarNascimento/flow-testes |
| Alteração preexistente | sugestoes-skills/melhores-praticas-agentes.md não versionado |

Configurações encontradas: `~/.codex/config.toml`, `~/.claude.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json` e `.claude/settings.local.json`. Não copiar credenciais dessas configurações para o repositório. A configuração local do Claude já está ignorada pelo Git no ambiente inspecionado.

`codex mcp list --json` retornou lista vazia. Não foram encontrados servidores MCP nos campos de configuração examinados do Claude para este projeto nem Hooks declarados nos arquivos examinados. Plugins e estado de conexão exigem validação própria antes da conclusão do inventário.

Skills globais encontradas: Skills de sistema do Codex e `browser-automation` / `game-development` do Claude. Preservar ambas. A Skill browser-automation depende de patchright e de resolução de dependências fora do projeto; sua existência não comprova funcionamento ou portabilidade.

## Sequência de entregas

1. **Inventário:** terminar a inspeção de plugins, autenticação, compatibilidade e configurações efetivas sem revelar secrets.
2. **Contexto:** registrar produto, arquitetura alvo, regras dos agentes e plano. Commit `docs: define contexto e fluxo de trabalho do FlowTest`.
3. **Base executável:** conforme decisão de escopo, criar a estrutura Electron ou execução local do protótipo, com dependências justificadas e versões fixadas no lockfile. Verificar compatibilidade do Node instalado antes de escolher versões. Commit `chore: configura ambiente de desenvolvimento`.
4. **Scripts:** formatação, lint, typecheck, testes relacionados, check e validate, conforme a arquitetura real; testar sucessos e falhas relevantes. Microcommits separados para infraestrutura e testes.
5. **MCPs:** configurar e testar Context7, GitHub, Playwright, Chrome DevTools, Electron via CDP e shadcn, nessa ordem, com um commit por integração concluída. Avaliar se DevTools oficial atende Electron sem instalar servidor comunitário redundante. Auditar qualquer implementação Electron adicional antes de adotá-la.
6. **Skills:** auditar candidatas oficiais/reconhecidas, incluindo SKILL.md e scripts auxiliares; registrar origem, versão/revisão, manutenção e justificativa. Criar workflows locais de arquitetura Electron, implementação, debugging, testes e revisão. Evitar Skills redundantes.
7. **Hooks:** configurar cada verificação sobre scripts compartilhados e adaptadores nativos dos clientes. Validar formatação, lint, typecheck, testes relacionados, proteção de comandos, secrets, segurança Electron e build. Confirmar disparos reais, não apenas executar scripts manualmente.
8. **Ponta a ponta:** em cada CLI, consultar documentação, ler o repositório, inspecionar UI/console e exercitar implementação, debugging, testes e review. Usar uma tarefa pequena e controlada, removendo alterações exclusivas de teste.
9. **Entrega:** completar docs/MCP_SETUP.md, docs/AGENT_SETUP.md e TROUBLESHOOTING.md. Registrar arquivos, pacotes, processos, portas, autenticações, evidências e diferenças entre clientes.

## Decisões técnicas a verificar na implementação

- Preferir configurações locais ao projeto. Codex documenta `.codex/config.toml`; Claude oferece registro com escopo `project`. Não usar comandos que alterem configurações globais quando a alternativa local satisfizer o objetivo.
- Compartilhar uma instalação local por pacote entre clientes. Compartilhar instalação não implica compartilhar o mesmo processo/browser ou a mesma sessão.
- Codex descobre Skills em `.agents/skills`; Claude documenta `.claude/skills`. Verificar compartilhamento por links relativos e descoberta real nas versões instaladas, evitando cópias divergentes.
- Hooks Codex exigem confiança na definição revisada via `/hooks`. Não forjar estado de confiança nem usar bypass como prova de funcionamento normal.
- GitHub: preferir autenticação oficial aproveitando gh quando compatível, sem persistir PATs nos arquivos. Limitar os toolsets ao escopo solicitado e não efetuar mutações remotas durante testes de leitura.
- CDP: loopback, somente desenvolvimento, ativação explícita e verificação de ausência em produção.
- Testes devem separar configurado, conectado e operação real bem-sucedida. Autenticação pendente, restrição do sandbox e ausência de app são limitações, nunca sucesso.

## Fontes consultadas

- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [Codex Skills](https://learn.chatgpt.com/docs/build-skills)
- [Codex Hooks](https://learn.chatgpt.com/docs/hooks)
- [Claude MCP](https://code.claude.com/docs/en/mcp)
- [Claude Skills](https://code.claude.com/docs/en/skills)
- [Claude Hooks](https://code.claude.com/docs/en/hooks)

A documentação online pode descrever versões posteriores às instaladas. Confirmar comportamento usando help, configuração efetiva e testes das CLIs locais antes de adotar recursos.
