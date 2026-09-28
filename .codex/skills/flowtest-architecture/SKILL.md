---
name: flowtest-architecture
description: Orienta decisões React, TypeScript, Electron e IPC no FlowTest ao projetar módulos ou revisar mudanças de arquitetura e segurança desktop.
---

Leia `CLAUDE.md` e a spec do módulo. O repositório contém React/FSD, Electron main/preload e protótipo HTML de referência. Edite as fontes em src/, nunca o bundle do protótipo. O transporte ADB/WebUSB atual está no renderer; não amplie permissões nem confunda esse estado com a arquitetura alvo de ADB no main.

Quando houver fontes React/TypeScript, mantenha estado de domínio (Flow, Action, Step, Dataset, Device, Ambiente) separado do estado transitório da UI. Use uniões discriminadas para tipos de passos e estados de execução, e valide dados de fronteira em runtime. Teste a semântica de loops/condições e preserve a identidade de passos ao editar o Flow. Não adote Zustand, React Flow ou outra biblioteca só porque foi citada no planejamento; confira dependências e a spec.

Renderer não executa ADB/Appium ou comandos Node diretamente. Main/serviços privilegiados gerenciam processos e devices; preload expõe operações pequenas e tipadas via contextBridge. Valide payload, origem e sender de IPC. Não exponha ipcRenderer, shell ou execução JavaScript genérica ao renderer.

Na revisão Electron, examine nodeIntegration, contextIsolation, sandbox, webSecurity, preload, ipcMain/ipcRenderer, navegação externa, shell.openExternal e executeJavaScript. Diferencie exemplo/teste e configuração real; explique a cadeia de risco em vez de declarar vulnerabilidade por palavra-chave. CDP exige desenvolvimento explícito, loopback e app não empacotado. Verifique a ausência de porta em produção com o runtime quando disponível.

Consulte documentação por Context7 ou fontes oficiais para APIs dependentes de versão. A referência de segurança é https://www.electronjs.org/docs/latest/tutorial/security. Não confunda o detector estático do projeto com auditoria completa.
