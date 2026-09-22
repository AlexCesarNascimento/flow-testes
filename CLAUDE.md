# FlowTest

O FlowTest é um produto desktop para criação visual de testes mobile, pensado para QAs manuais, analistas de negócio e product owners. A proposta é reduzir a dependência de scripts de automação, a fragilidade dos seletores e a duplicação de cenários. A stack alvo é React, TypeScript, Electron e Node.js.

## Estado atual

O repositório começa com `Design – 00 · FlowTest — protótipo clicável.html`, referência visual e de interação. Ainda não há aplicação Electron, fontes TypeScript, `package.json` ou suíte de testes. Não apresentar a visão de produto abaixo como funcionalidade já implementada. Atualizar esta seção conforme a implementação for validada.

## Domínio do produto

- **Recorder:** captura interações em device físico ou emulador. Sugere seletores estáveis, priorizando resource-id e accessibility-id e usando fallback quando justificável.
- **Action:** sequência de passos reutilizável, como fazer login.
- **Flow:** composição visual de passos, Actions, condicionais, repetições e variáveis, incluindo blocos no estilo Scratch com linguagem acessível em português.
- **Dataset:** dados parametrizados; a execução combina Dados × Device × Ambiente sem duplicar o Flow.
- **Self-healing:** tentativa de reencontrar elementos que mudaram; registrar evidências e decisões, sem transformar uma falha funcional em sucesso silencioso.
- **Debug:** evidências do estado do app antes, durante e depois dos passos para distinguir bug do app, teste desatualizado e seletor alterado.

## Regras de arquitetura e produto

1. Preservar o HTML original como referência; não editar o bundle comprimido diretamente. Mudanças visuais devem partir de fontes editáveis ou de uma regeneração controlada.
2. Separar React renderer, preload e Electron main. Acesso privilegiado a devices, Appium/ADB e processos pertence ao lado Node/main, com contratos IPC limitados e validados.
3. Tratar dados de teste, credenciais de ambientes e informações capturadas dos devices como potencialmente sensíveis. Não gravar secrets em código, specs, logs de validação ou configurações versionadas.
4. Manter CDP restrito ao desenvolvimento local. Builds de produção não devem habilitar debugging remoto.
5. Não implementar Recorder, execução Appium/ADB ou self-healing como efeito colateral da configuração do ambiente. Esses módulos exigem specs e entregas próprias.
6. UI, mensagens e documentação em português brasileiro. Identificadores de código podem seguir as convenções da stack.
7. Preservar navegação, identidade visual e design tokens existentes ao alterar a interface. Não adotar temas de outros projetos sem decisão de produto.

## Trabalho dos agentes

Consultar `AGENTS.md` para o ciclo de implementação e validação, e `docs/SETUP_PLAN.md` para as etapas de preparação do ambiente. Codex e Claude compartilham as mesmas regras de produto. Comandos de desenvolvimento só devem ser documentados como disponíveis depois de criados e testados.
