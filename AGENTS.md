# Trabalho no FlowTest

Leia `CLAUDE.md` como fonte de contexto do produto e arquitetura. Leia as instruções aplicáveis aos arquivos que serão alterados. Preserve configurações, permissões e alterações preexistentes do usuário.

## Etapas e commits

- Executar uma etapa por vez: entender o requisito, implementar a menor mudança coerente, validar, revisar o diff e fazer microcommit semântico.
- Usar Conventional Commits, por exemplo `docs: descreve arquitetura do FlowTest`, `chore(mcp): configura Context7` e `test: valida navegação do editor`.
- Incluir no commit apenas arquivos da etapa. Não incorporar alterações preexistentes ou usar staging amplo sem revisar cada arquivo.
- Não fazer push, merge, publicação, reset destrutivo, limpeza ampla ou reescrita de histórico sem autorização correspondente.

## Spec antes de funcionalidade não trivial

Criar ou atualizar uma spec em `.claude/specs/`, compartilhada pelos dois agentes. Definir propósito, escopo, contratos, componentes, estados vazio/carregando/erro/sucesso, interações, transições e critérios de aceitação conforme aplicável. Separar comportamento real de dados simulados. Perguntar somente quando faltar uma decisão que impeça avançar com segurança.

## Validação proporcional

1. Identificar os scripts e testes realmente disponíveis; não inventar comandos nem tratar a ausência de testes como aprovação.
2. Rodar formatação, lint, TypeScript e testes relacionados quando existirem e forem aplicáveis à mudança.
3. Para interface, executar o app ou protótipo, inspecionar DOM/console e testar o fluxo alterado. Capturar e inspecionar screenshots quando necessário para avaliar o resultado visual.
4. Para Electron, distinguir renderer, preload, main e IPC. Validar os processos afetados; uma página funcionando no navegador não comprova que o app Electron funciona.
5. Usar MCP para investigação interativa e testes versionados para regressões permanentes. Executar E2E mais amplo quando o risco justificar, não após toda edição.
6. Revisar bugs, regressões, segurança, acessibilidade e diff final. Antes de concluir alterações executáveis, validar o build aplicável.
7. Relatar comandos executados, evidências, falhas e limitações. Marcar uma integração como testada somente após uma operação real bem-sucedida.

## Integrações

Skills orientam workflows; Hooks executam verificações repetitivas; MCPs oferecem ferramentas e acesso externo. Compartilhar scripts e conteúdo entre Codex e Claude, preservando os formatos nativos de configuração de cada cliente. Não instalar ferramentas ou Skills de terceiros sem verificar origem, conteúdo e necessidade.

Hooks de proteção complementam as permissões nativas, sem substituí-las. Não desativar sandbox, confiança em Hooks ou controles de autenticação para fazer uma validação parecer aprovada.
