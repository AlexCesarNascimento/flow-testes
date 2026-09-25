# Mandato — Feature-Sliced Design (FSD)

## Referência

Metodologia oficial: https://feature-sliced.design

## Estrutura de camadas

```
src/renderer/src/
  app/          ← inicialização, router, providers, estilos globais
  pages/        ← composição de widgets por rota
  widgets/      ← blocos de UI autônomos e complexos
  features/     ← interações do usuário com valor de negócio
  entities/     ← modelos, stores e tipos de domínio
  shared/       ← infraestrutura reutilizável sem domínio
```

## Regra de dependência (import rule)

Camadas só podem importar das camadas **abaixo** delas:

```
app → pages → widgets → features → entities → shared
```

Proibido: `entities` importar de `features`; `shared` importar de qualquer outra camada.

## Estrutura de um slice

Cada slice (pasta dentro de uma camada) segue:

```
widgets/recorder-steps-panel/
  ui/
    RecorderStepsPanel.tsx
    recorder-steps-panel.scss
  model/
    index.ts          ← store slice ou hooks locais, se necessário
  index.ts            ← public API do slice (único ponto de import externo)
```

### Public API (`index.ts`)

Exportar apenas o que outros slices precisam. Nunca importar de dentro de um slice diretamente:

```ts
// ✅ correto
import { RecorderStepsPanel } from '@/widgets/recorder-steps-panel';

// ❌ errado
import { RecorderStepsPanel } from '@/widgets/recorder-steps-panel/ui/RecorderStepsPanel';
```

## Onde cada coisa fica

| O quê                                                          | Camada                            |
| -------------------------------------------------------------- | --------------------------------- |
| BrowserRouter, rotas, `<App />`                                | `app/`                            |
| CSS global, design tokens                                      | `app/styles/` ou `shared/styles/` |
| Zustand store global                                           | `entities/<entidade>/model/`      |
| Um store por entidade: step, recorder, flow, dataset, ambiente | `entities/`                       |
| Ação "mudar fase do recorder"                                  | `features/recorder-phase/`        |
| Ação "selecionar step"                                         | `features/step-selection/`        |
| Sidebar, TopBar, AppShell                                      | `widgets/app-shell/`              |
| PhasesBar, StepsPanel, InspectorPanel, DeviceFrame             | `widgets/recorder-*/`             |
| Componentes base (Button, Badge, Input) sem domínio            | `shared/ui/`                      |
| Contratos IPC, tipos de bridge                                 | `shared/api/`                     |
| Design tokens SCSS, mixins, reset                              | `shared/styles/`                  |
| Funções utilitárias (formatTime, cn)                           | `shared/lib/`                     |

## Path aliases

Configurar em `electron.vite.config.ts` e `tsconfig.json`:

```ts
'@/*': ['src/renderer/src/*']
```

Assim `@/shared/ui` resolve para `src/renderer/src/shared/ui`.

## Regras absolutas

- Nunca criar pasta `utils/` ou `helpers/` na raiz — pertence a `shared/lib/`
- Nunca criar `components/` na raiz — pertence a `widgets/` ou `shared/ui/`
- Nunca colocar store global em `app/` — pertence a `entities/`
- Um slice não importa de outro slice **da mesma camada** (exceto `shared`)
- Cada slice tem exatamente um `index.ts` que é sua public API
