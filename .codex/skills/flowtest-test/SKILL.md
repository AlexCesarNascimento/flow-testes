---
name: flowtest-test
description: Seleciona e executa validações proporcionais no FlowTest usando testes Node, TypeScript, Playwright e inspeção visual ou acessibilidade conforme a mudança.
---

Leia o diff e `package.json`; enumere `tests/` e leia o seletor de testes antes de declarar ausência de cobertura. `npm run typecheck` verifica tooling/testes; `npm run typecheck:app` verifica o renderer; `npm run build` compila main/preload/renderer. Os E2E padrão exercitam o protótipo, não o app Electron. `npm run test:related -- <arquivos>` seleciona testes Node do tooling, incluindo o teste de proteção do servidor. Uma mensagem de ausência de testes relacionados não comprova cobertura.

Para scripts, rode formatação, lint, types e testes relacionados; para configurações MCP, faça handshake e ao menos uma operação real com `scripts/mcp-smoke.ts`. Confirme descoberta separadamente em cada CLI; handshake pelo SDK não comprova uso pelo agente.

Para interface, inicie `npm run dev`, reproduza a interação via Playwright MCP e verifique DOM/console. Use `npm run test:e2e -- --grep <caso>` para regressão específica e a suíte completa quando escopo/risco justificar. Os casos existentes são smoke tests do protótipo, não testes de execução mobile real. Desktop e viewport mobile não certificam responsividade por si só.

Verifique foco, navegação por teclado, rótulos e estados quando afetados; use a Skill oficial `a11y-debugging` disponível no projeto para uma investigação de acessibilidade. Para lentidão, meça antes de otimizar com DevTools; não transforme toda tarefa em auditoria de performance.

`npm run validate` agrega os checks configurados e E2E. Verifique scripts de build quando passarem a existir. Não confunda ausência de build Electron com build aprovado. Registre comando, resultado e evidência; limpe apenas fixtures criadas no teste e encerre processos de sua sessão.
