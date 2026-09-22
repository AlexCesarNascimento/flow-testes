---
name: flowtest-implement-feature
description: Implementa funcionalidades ou issues do FlowTest com spec, alterações pequenas, testes proporcionais e microcommits semânticos.
---

Leia `CLAUDE.md`, `AGENTS.md` e o diff inicial. Se a entrada for uma issue, leia requisitos e comentários com GitHub MCP; se faltar autenticação, peça o login ou o texto da issue sem inventar requisitos. Para mudança não trivial, registre antes uma spec em `.claude/specs/` com estados, interações, contratos e aceitação.

Descubra fontes e scripts existentes antes de escolher a implementação. O HTML é referência visual, não fonte editável do aplicativo: se a tarefa depender de uma base React/Electron ausente, explicite essa dependência e confirme o escopo necessário. Use Context7 quando precisar de documentação de bibliotecas; shadcn serve para consultar componentes, sem inicializar frameworks por conta própria.

Implemente uma fatia coerente. Formate os arquivos alterados, execute lint, typecheck e testes relacionados. Use `npm run check` para tooling; para mudanças visíveis, execute `npm run dev` e valide o fluxo com Playwright/DevTools e um E2E relevante. Quando existir Electron, execute também seu development, examine console e valide renderer/preload/main afetados. Não trate o browser como prova de execução Electron.

Revise bugs, segurança, acessibilidade, dependências e diff. Execute `npm run validate` ao concluir uma mudança de tooling ou interface com esse escopo; relate checks não aplicáveis ou bloqueados. Faça microcommit semântico somente dos arquivos da etapa após validação. Não faça push, merge ou publicação sem autorização correspondente. Entregue comportamento, evidências e limitações.
