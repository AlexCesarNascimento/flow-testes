---
name: ecc-flowtest
description: Aplica os padrões ECC adaptados ao recorder React/Electron do FlowTest ao investigar captura, reconhecimento de telas, playback e testes de regressão.
---

# ECC para o FlowTest

Adaptação local das skills frontend-patterns, e2e-testing e verification-loop do ECC 2.2.2, revisadas no cache do Claude. Origem, licença e diferenças: [referência](references/origin.md).

Leia CLAUDE.md, os mandatos e a spec da fatia. No recorder, separe interação capturada, enriquecimento assíncrono, identidade da tela e estado de execução. IDs de steps precisam permanecer estáveis; índices servem apenas para ordem e progresso. Registre início antes do await e conclusão somente após resultado real. Cancelamento e falha não são sucesso.

Em React, mantenha resultados transitórios de playback fora da persistência do fluxo. Efeitos e subscriptions devem limpar listeners e invalidar respostas antigas ao parar, desmontar ou trocar sessão. Preserve as public APIs FSD; estilos seguem SCSS/BEM e tokens locais.

Reproduza o bug antes da correção e escreva regressões de comportamento para ordenação, espera de tela, cancelamento e erro. Em Playwright, use locators acessíveis e espere estados observáveis; transporte simulado deve ser identificado como tal. O E2E do protótipo não certifica Electron ou device real.

Verifique scripts existentes antes de executar checks: formatação dos arquivos da etapa, lint, typecheck, typecheck:app, testes relacionados e build. Inspecione console/DOM no app afetado. Relate a evidência real e os bloqueios; não invente percentuais de cobertura nem trate testes pulados como sucesso. Revise o diff inicial e final e faça microcommits apenas da etapa, preservando alterações preexistentes.
