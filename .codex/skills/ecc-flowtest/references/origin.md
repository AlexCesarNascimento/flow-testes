# Origem e adaptação

- Projeto: https://github.com/affaan-m/ECC
- Instalação Claude: ecc@ecc, versão 2.2.2, commit e482e579415fde18357cafce70f177ae19fd7f03.
- Fontes lidas: .agents/skills/frontend-patterns/SKILL.md, .agents/skills/e2e-testing/SKILL.md e .agents/skills/verification-loop/SKILL.md.
- Licença MIT preservada em LICENSE.txt.
- Adaptado: React/FSD/SCSS, scripts reais, testes proporcionais e distinção entre protótipo, Electron e Android. Exemplos genéricos ECC de Next.js, CI, cobertura fixa, comandos Claude e integrações externas não são requisitos do FlowTest.
- Não executa instaladores, hooks ou scripts ECC. Configurações de autenticação, sandbox e MCP permanecem nas configurações nativas existentes.
- Descoberta local: .agents/skills e .claude/skills apontam para .codex/skills. Referência oficial: https://learn.chatgpt.com/docs/build-skills.
