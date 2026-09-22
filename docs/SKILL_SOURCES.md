# Origem e auditoria das Skills

Auditoria em 2026-09-22. Skills em `.codex/skills/` (fonte de verdade). `.agents/skills` e `.claude/skills` são symlinks de diretório apontando para `../.codex/skills`. Nenhuma Skill global removida ou alterada.

## a11y-debugging

- Origem: https://github.com/ChromeDevTools/chrome-devtools-mcp/tree/chrome-devtools-mcp-v1.9.0/skills/a11y-debugging
- Mantenedor: organização ChromeDevTools / Google LLC. Distribuição oficial npm `chrome-devtools-mcp@1.9.0`, integridade fixada em package-lock.json; pacote atualizado em 2026-09-08 segundo o registry consultado.
- Licença Apache-2.0, copiada junto da Skill.
- Conteúdo auditado: SKILL.md e references/a11y-snippets.md completos. Não há scripts auxiliares executáveis. Os snippets consultam DOM, estilos e acessibilidade; a navegação/auditoria MCP pode gerar requests e gravar relatórios. Não há manipulação de credenciais, instalação de pacotes, limpeza de diretórios ou execução de shell automática.
- SKILL.md SHA-256: `159587fc580e6112528bedcd89d8c69a52d2fbb54602f10c71d7d5ec8fdbf299`.
- a11y-snippets.md SHA-256: `93a02d8889738300461b63da77c1647d4d0156fd9b75107574fbed0a931c20ab`.
- Limites: sugestões de tamanho de alvo e contraste simplificado não certificam conformidade. Avaliar layout/contexto e usar auditoria apropriada. Usar os pageIds retornados pelas ferramentas; não presumir IDs estáticos.
- Não instalar a Skill CLI do mesmo pacote: acrescentaria outro mecanismo de execução e permissões de filesystem desnecessárias. O MCP já oferece a funcionalidade requerida.

## Skills locais

Criadas para o FlowTest, sem código ou scripts baixados de terceiros:

| Skill                      | Responsabilidade                                              |
| -------------------------- | ------------------------------------------------------------- |
| flowtest-architecture      | Domínio, padrões React/TypeScript e fronteiras Electron/IPC   |
| flowtest-implement-feature | Spec, implementação incremental, validação e microcommits     |
| flowtest-debug             | Reprodução, identificação de camada e confirmação da correção |
| flowtest-test              | Seleção de testes Node/Playwright, visual e acessibilidade    |
| flowtest-review            | Revisão concreta de diff, bugs, testes e segurança            |

Não instalar pacotes genéricos de React, Tailwind, Zustand ou Vite nesta fase: o projeto ainda não possui essas dependências/fontes editáveis. A orientação de arquitetura é condicional à criação futura da aplicação. A Skill global browser-automation foi preservada; ela depende de patchright externo, então o workflow compartilhado usa o Playwright oficial instalado no projeto.

Atualização: auditar novamente SKILL.md, referências e licença de uma revisão identificada; atualizar hashes e repetir validação de comportamento. Não atualizar automaticamente junto de npm update. Remoção: remover somente o diretório da Skill em `.codex/skills/`; os symlinks de diretório em `.agents/` e `.claude/` apontam para o mesmo local e não precisam de ajuste.
