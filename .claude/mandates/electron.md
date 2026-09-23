# Mandato — Arquitetura Electron

## Ferramenta de build

Usar `electron-vite` como único build tool. Ele gerencia os três processos com configs Vite separadas em um único `electron.vite.config.ts`.

```
electron.vite.config.ts   ← config unificada (main / preload / renderer)
src/
  main/         ← processo principal do Electron
  preload/      ← bridge IPC
  renderer/     ← app React (FSD)
```

## Processos

### Main (`src/main/index.ts`)

Responsabilidades exclusivas do main:
- Criar e gerenciar `BrowserWindow`
- Ciclo de vida da aplicação (`app.on('ready')`, `app.on('window-all-closed')`)
- Handlers IPC (`ipcMain.handle`)
- Acesso a ADB, Appium, sistema de arquivos, processos Node

Nunca acessar APIs do Electron renderer (`ipcRenderer`, `contextBridge`) no main.

### Preload (`src/preload/index.ts`)

- Expor somente o necessário via `contextBridge.exposeInMainWorld`
- Tipar o bridge em `src/renderer/src/shared/api/ipc.ts`
- Nunca expor `require`, `process` ou `shell` diretamente

Exemplo de bridge mínimo:
```ts
contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: unknown[]) =>
    ipcRenderer.invoke(channel, ...args),
})
```

### Renderer (`src/renderer/`)

- Código React puro, sem imports de `electron`, `node:*` ou `child_process`
- Acesso privilegiado ocorre sempre via `window.api.invoke('canal', payload)`
- Contratos IPC definidos em `shared/api/` como tipos TypeScript

## Scripts do package.json

```json
"dev":     "electron-vite dev",
"build":   "electron-vite build",
"preview": "electron-vite preview",
"pack":    "electron-builder --dir",
"dist":    "electron-builder"
```

## Regras absolutas

- Nunca usar `nodeIntegration: true`; usar `contextIsolation: true` sempre
- Nunca importar módulos Node diretamente no renderer
- Builds de produção não habilitam `--remote-debugging-port`
- IPC channels são strings literais tipadas — sem strings dinâmicas
