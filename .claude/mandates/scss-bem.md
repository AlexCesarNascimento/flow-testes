# Mandato — Estilos: SCSS + BEM

## Regra fundamental

**Zero `style={{}}` inline no JSX.** Todo estilo vai em arquivo `.scss` separado ao lado do `.tsx`.

## Localização dos arquivos

Cada componente tem seu próprio arquivo `.scss` na mesma pasta:

```
widgets/recorder-steps-panel/
  ui/
    RecorderStepsPanel.tsx
    recorder-steps-panel.scss    ← estilos do componente
```

O `.tsx` importa o `.scss`:

```tsx
import './recorder-steps-panel.scss';

export function RecorderStepsPanel() {
  return <div className="recorder-steps-panel">...</div>;
}
```

## Design tokens

Todos os tokens ficam em `shared/styles/_variables.scss` como CSS custom properties:

```scss
// shared/styles/_variables.scss
:root {
  --color-bg: #0f0f0f;
  --color-sidebar: #161616;
  --color-surface: #1c1c1c;
  --color-elevated: #242424;
  --color-border: #262626;
  --color-border-strong: #333;
  --color-text-1: #f5f5f5;
  --color-text-2: #a3a3a3;
  --color-text-3: #6b6b6b;
  --color-accent: #22c55e;
  --color-accent-text: #4ade80;
  --color-accent-bg: color-mix(in srgb, #22c55e 10%, transparent);
  --color-red: #ef4444;
  --color-blue: #3b82f6;
  --color-purple: #8b5cf6;
  --color-amber: #f59e0b;
}
```

Mixins e funções reutilizáveis ficam em `shared/styles/_mixins.scss`.

O arquivo de entrada (`app/styles/index.scss`) importa tudo:

```scss
@use '../../../shared/styles/variables';
@use '../../../shared/styles/reset';
```

## Nomenclatura BEM

```
.bloco
.bloco__elemento
.bloco__elemento--modificador
.bloco--modificador
```

### Exemplos práticos

```scss
// sidebar.scss
.sidebar {
  width: 200px;
  background: var(--color-sidebar);

  &__nav {
    padding: 8px;
  }

  &__nav-item {
    display: flex;
    color: var(--color-text-2);

    &--active {
      color: var(--color-accent);
      background: var(--color-accent-bg);
    }
  }

  &__section-label {
    font-size: 11px;
    color: var(--color-text-3);
  }
}
```

```tsx
// Sidebar.tsx
<nav className="sidebar__nav">
  <a
    className={`sidebar__nav-item${active ? ' sidebar__nav-item--active' : ''}`}
  >
    Flows
  </a>
</nav>
```

## Convenções de nomeação de blocos

Usar kebab-case. O bloco deve ter o mesmo nome do arquivo:

| Arquivo                     | Bloco BEM               |
| --------------------------- | ----------------------- |
| `sidebar.scss`              | `.sidebar`              |
| `phases-bar.scss`           | `.phases-bar`           |
| `recorder-steps-panel.scss` | `.recorder-steps-panel` |
| `device-frame.scss`         | `.device-frame`         |
| `inspector-panel.scss`      | `.inspector-panel`      |

## Estrutura de um arquivo `.scss`

```scss
// 1. imports de mixins/funções (nunca variáveis — são CSS custom props, não SCSS vars)
@use '@/shared/styles/mixins' as *;

// 2. bloco raiz
.nome-do-bloco {
  // propriedades do bloco

  // 3. elementos com &__
  &__header { ... }
  &__body { ... }

  // 4. modificadores com &--
  &--compact { ... }

  // 5. estados com & + pseudo-class
  &:hover { ... }
  &:focus-visible { ... }
}
```

## Regras absolutas

- Nunca usar `style={{}}` no JSX — sem exceções
- Nunca usar Tailwind utility classes — o projeto usa SCSS puro
- Nunca criar seletores globais fora de `shared/styles/` (exceto `:root`)
- Nunca aninhar mais de 3 níveis de profundidade no SCSS
- Modificadores de estado (`--active`, `--disabled`, `--loading`) sempre no elemento, nunca no filho
- Classes utilitárias (`u-visually-hidden`, `u-truncate`) somente em `shared/styles/_utilities.scss`
