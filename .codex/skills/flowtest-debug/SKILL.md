---
name: flowtest-debug
description: Investiga bugs de interface e futuros bugs Electron do FlowTest reproduzindo a falha, isolando a camada afetada e verificando a correção.
---

Registre ação de entrada, resultado esperado e observado. Descubra se há aplicação Electron ou somente protótipo. No estado atual, use `npm run dev`; não crie uma aplicação Electron fictícia para declarar uma reprodução.

Reproduza com Playwright MCP, tirando snapshot antes de interagir. Capture exceções/console e, se relevante, Network e screenshot com Chrome DevTools. Inspecione a imagem gerada. Não conclua que um clique funcionou só porque a ferramenta retornou sucesso: verifique a mudança observável no DOM ou estado.

Quando houver Electron, classifique a falha: renderer React, preload, main, IPC ou Node. Inicie pelo script development auditado. O lançador `node scripts/chrome-devtools.ts --electron` só conecta a CDP em 127.0.0.1:9222; exige app em desenvolvimento já iniciado e compatibilidade a validar. Para main/IPC, examine logs e contratos, pois CDP do renderer não cobre esses processos automaticamente.

Forme uma hipótese com evidência, faça uma mudança pequena para testar e corrija a causa raiz. Não masque erros com catch vazio, timeouts fixos ou bypass de segurança. Execute testes relacionados e repita o fluxo original. Para regressão de UI, adicione E2E versionado quando houver fonte editável e comportamento definido. Compare evidências antes/depois e declare camadas ainda não testadas.
