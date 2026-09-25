# Decisões de Arquitetura — FlowTest

Registro cronológico das decisões técnicas relevantes. Cada entrada responde: **o que**, **por que**, e **o que foi descartado**.

---

## ADR-001 — Electron + electron-vite como plataforma desktop

**Data:** 2026-09-22  
**Status:** Aceita

### Decisão
Usar Electron como shell desktop com `electron-vite` como build tool unificado para main, preload e renderer.

### Motivação
- App precisa de acesso a USB, processos nativos (ADB) e sistema de arquivos — impossível em SPA web pura
- `electron-vite` configura os três processos com Vite 8 em um único `electron.vite.config.ts`, com HMR no renderer e reload automático do main

### Descartado
- **Tauri**: ecossistema Rust, sem WebUSB nativo, menor flexibilidade para ADB/IPC
- **NW.js**: comunidade menor, menos suporte a WebUSB
- **Electron Forge**: mais opinativo; `electron-vite` tem integração com Vite superior para nosso stack React

---

## ADR-002 — Feature-Sliced Design (FSD) no renderer

**Data:** 2026-09-22  
**Status:** Aceita

### Decisão
Organizar `src/renderer/src/` em camadas FSD: `app → pages → widgets → features → entities → shared`.

### Motivação
- Regra de dependência unidirecional elimina imports circulares conforme o projeto cresce
- Cada camada tem responsabilidade clara: `entities` = modelos/estado, `features` = ações de negócio, `widgets` = blocos de UI
- `index.ts` como public API de cada slice facilita refatoração interna sem quebrar contratos externos

### Descartado
- **Feature folders por domínio (ex: `/recorder/components/...`)**: escala mal quando features compartilham entidades
- **Atomic Design**: pensado para sistemas de design, não para lógica de produto

---

## ADR-003 — SCSS + BEM, zero inline styles

**Data:** 2026-09-22  
**Status:** Aceita

### Decisão
Cada componente tem um `.scss` ao lado do `.tsx`. Nomenclatura BEM. Design tokens como CSS custom properties em `shared/styles/_variables.scss`. Zero `style={{}}` no JSX (exceto injeção de CSS vars dinâmicas).

### Motivação
- Tailwind v4 foi removido: gerava conflito com `electron-vite` e tornava o código difícil de auditar em code review
- BEM elimina colisão de nomes sem precisar de CSS Modules
- CSS custom properties são acessíveis em runtime (temas futuros) e não precisam de SCSS vars

### Descartado
- **CSS Modules**: verboso com FSD (import styles from './...'); BEM cobre o mesmo problema de escopo
- **Tailwind**: dificulta leitura de diff e conflitava com o build Electron

---

## ADR-004 — Espelhamento Android via @yume-chan/scrcpy (sem binários nativos)

**Data:** 2026-09-24  
**Status:** Aceita

### Decisão
Usar `@yume-chan/adb` + `@yume-chan/adb-scrcpy` sobre **WebUSB** (via `navigator.usb` do Chromium/Electron) para detectar devices Android e espelhar a tela com o protocolo scrcpy.

### Motivação
- **Zero binários nativos**: não é necessário bundlar `adb` ou `scrcpy` por plataforma (macOS arm64/x64, Windows, Linux)
- **WebUSB nativo no Electron**: Chromium já implementa `navigator.usb`; basta configurar permissão na session do main process
- **Protocolo scrcpy em TypeScript**: `@yume-chan/scrcpy` reimplementa o protocolo completo — empurra `scrcpy-server.jar` (~500 KB, bundlado no app) para o device e recebe stream H264
- **Decodificação sem plugins**: `WebCodecsDecoder` usa a API WebCodecs do Chromium (hardware-accelerated); `TinyH264Decoder` como fallback software

### Descartado
- **Bundlar binário `scrcpy`**: binário por plataforma × arquitetura, complicação de assinatura no macOS, CI mais pesado
- **Bundlar `adb`**: mesmo problema + drivers USB no Windows
- **`adb screencap` periódico**: 3–5 FPS máximo, latência alta, não serve para inspeção em tempo real
- **WebRTC via servidor relay**: requer infraestrutura externa, latência de rede extra, fora de escopo para app local

---

## ADR-005 — Ports & Adapters para integração com hardware/libs externas

**Data:** 2026-09-24  
**Status:** Aceita

### Decisão
Qualquer integração com biblioteca externa ou hardware (device mirror, ADB, Appium no futuro) é isolada atrás de uma **porta** (interface TypeScript) em `shared/lib/<domínio>/port.ts`. A implementação concreta fica em `shared/lib/<domínio>/adapters/<nome>.ts`. A feature ou entity só conhece a porta — nunca importa a lib externa diretamente.

```
shared/lib/device-mirror/
  port.ts                         ← interface DeviceMirrorPort (contrato)
  adapters/
    scrcpy-webusb-adapter.ts      ← implementação @yume-chan
    mock-adapter.ts               ← implementação fake para dev/test
  index.ts                        ← exporta porta + factory
```

O adaptador ativo é injetado uma vez na inicialização do app (`app/index.tsx`) e disponibilizado via módulo singleton no `features/device-mirror`.

### Motivação
- **Troca sem impacto no produto**: se surgir uma lib melhor (ex: scrcpy binário bundlado, WebRTC, solução proprietária), basta escrever um novo adaptador que implemente a mesma porta — zero mudança em features, widgets ou pages
- **Testabilidade**: `MockDeviceAdapter` simula plug/unplug e frames sem hardware real
- **Evita acoplamento acidental**: imports de `@yume-chan` ficam estritamente dentro de `adapters/`, não vazam para `features/` ou `widgets/`

### Portas definidas até agora

| Porta | Arquivo | Adaptadores |
|---|---|---|
| `DeviceMirrorPort` | `shared/lib/device-mirror/port.ts` | `ScrcpyWebUsbAdapter`, `MockDeviceAdapter` |

### Descartado
- **Importar `@yume-chan` direto na feature**: acoplamento duro, impossível trocar sem reescrever a feature
- **Context API React para o adaptador**: overhead desnecessário para um singleton de infraestrutura; o adaptador não é estado de UI
