---
name: flowtest-review
description: Revisa o diff do FlowTest priorizando bugs, regressões, segurança, contratos, testes e problemas concretos de interface ou Electron.
---

Inspecione `git status`, diff staged e unstaged, novos arquivos e contexto dos chamadores. Diferencie mudanças preexistentes das da tarefa. Leia as specs e o comportamento esperado; não considere a visão de produto como implementação pronta.

Priorize problemas demonstráveis: caminho que quebra, estado inconsistente, contrato IPC sem validação, vazamento de segredo, acesso fora do projeto, regressão visual/acessibilidade, dependência sem justificativa ou teste que passa sem verificar resultado. Examine erros e cancelamento, React/TypeScript quando presentes, duplicação relevante, código morto e custo de operações repetidas.

Para Electron, avalie isolamento, preload, IPC, shell.openExternal, navegação e CDP somente de desenvolvimento. Analise contexto antes de classificar um padrão como vulnerabilidade. Revise Hooks por bypass acidental, falsos positivos, recursão e custo; não apresente regex de shell como sandbox completo.

Rode os checks proporcionais já disponíveis. Apresente achados com severidade, arquivo/linha, gatilho e impacto. Se não houver achados concretos, diga isso e registre lacunas de teste. Não modifique arquivos numa revisão somente leitura, não publique comentários remotos e não faça commits/push sem instrução correspondente.
