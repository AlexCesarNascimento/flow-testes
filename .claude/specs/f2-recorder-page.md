# Spec — Feature 2: Página Recorder (3 fases)

**Data:** 2026-09-22  
**Escopo:** `src/pages/RecorderPage.tsx` + subcomponentes em `src/components/Recorder/`

---

## Propósito

Implementar a página `/recorder` com três fases navegáveis: Gravar, Editar e parametrizar, Salvar como Action.  
Não conecta ADB/Appium. Todo conteúdo é simulado (mock).

---

## Layout geral (todas as fases)

```
┌─ PhasesBar ──────────────────────────────────────────────────────────┐
│  1 Gravar › 2 Editar e parametrizar › 3 Salvar como Action  [indicador]│
└──────────────────────────────────────────────────────────────────────┘
┌─ DevicePanel ─┬─ StepsPanel ──────────────┬─ InspectorPanel ─────────┐
│               │                           │                           │
│  (esquerda)   │  (centro, flex-1)         │  (direita)               │
│  ~260px       │  flex 1                   │  ~280px                  │
│               │                           │                           │
└───────────────┴───────────────────────────┴───────────────────────────┘
```

Altura total da área de conteúdo: flex-1, overflow-hidden. Cada painel faz scroll internamente.

---

## Componentes

### PhasesBar

- Fases: `[{n:1, label:'Gravar'}, {n:2, label:'Editar e parametrizar'}, {n:3, label:'Salvar como Action'}]`
- Entre fases: chevron `›`
- Fase ativa: número em círculo `var(--color-accent)` + texto bold branco
- Fase anterior à ativa (completa): checkmark verde em círculo, texto `var(--color-text-2)`
- Fase futura: número em círculo `var(--color-elevated)`, texto `var(--color-text-3)`
- Lado direito (fase Gravar): badge vermelho `● Gravando 00:43` + botão Pausar + botão Finalizar (→ vai para fase Editar)
- Lado direito (fases Editar/Salvar): nada (indicador oculto)
- Clicar em fase passada ou ativa navega para ela; fase futura só se a anterior foi concluída (ou clique livre no protótipo)

### DevicePanel

- Header: "Dispositivo" + badge "AO VIVO" (verde) em fase Gravar, "CONECTADO" (cinza) em Editar/Salvar
- Frame de smartphone: borda arredondada 20px, largura 220px, fundo escuro (bordas cinza), overflow hidden
- **Tela de Login (fase Gravar)**:
  - Fundo `#1a5c45` (verde escuro) no header do app simulado
  - Ícone circular branco com fundo verde
  - Texto "Olá!" bold branco + "Que bom te ver por aqui."
  - Campo CPF com ícone + placeholder "Digite aqui"
  - Campo senha com ícone olho + placeholder "Digite sua senha"
  - Botão "Entrar" amarelo/dourado
  - Links "Esqueci minha senha" e "Abrir conta"
  - Bottom nav: Pix | Ajuda | Segurança
- **Tela pós-login (fase Editar/Salvar)**:
  - Header verde com "Olá, Alex" + avatar circular laranja "A"
  - Card branco com "Saldo disponível" + "R$ ••••••" + ícone olho
  - Bottom nav: Pix | Extrato | Transferir | Cartões
- Abaixo do frame (fase Gravar): botão verde "Preencher e entrar (demo)" — ao clicar, não faz nada no protótipo
- Controles zoom/reiniciar/capturar (fase Gravar, abaixo do botão demo)

### StepsPanel (centro)

**Fase Gravar:**

- Header: "Steps gravados" + badge count + botões Assert / Wait
- Lista: apenas step 1 (LAUNCH APP)
- Rodapé tip: "Cada toque e digitação vira um step com o melhor selector."

**Fases Editar e Salvar:**

- Header: "Steps" + badge count (7)
- Sub-header controles (só fase Editar): `▶ Este step` | `▶ Até aqui` | `▶ A partir daqui` | `▶ Tudo`
- Lista completa dos 7 steps, com checkboxes
- Step ativo (selectedStepId) destacado com borda azul + fundo levemente azulado

**Item de step:**

```
[checkbox] [número] [status-circle] [ícone-tipo] [label/valor]     [time]
```

- Tipos com cores:
  - `launchApp`: cinza, ícone rocket `📦`
  - `tap`: azul, ícone cursor `↗`
  - `inputText`: azul, ícone T
  - `waitForElement`: roxo, ícone X com badge AUTO
- Fase Salvar: steps selecionados (selected=true) mostram checkbox marcado azul; não-selecionados desmarcados

### InspectorPanel (direita) — Fase Gravar

- Header: "Inspector" + badge "INSPETOR LIGADO"
- Pill do elemento: "Application·app" (verde)
- Texto: "do step selecionado"
- Tabela: Classe | Texto | Accessibility ID | Resource ID | Bounds
- Seção "SELECTORS · DO MAIS ESTÁVEL AO MAIS FRÁGIL"
- Cada selector: tipo | (badge RECOMENDADO se recommended) | valor | badge estabilidade | botão Copiar
  - Estabilidade: 'stable' → verde "ESTÁVEL", 'medium' → amarelo "MÉDIO", 'fragile' → vermelho "FRÁGIL"
- Infobox: "Smart wait automático. Depois de um tap que navega..."

### InspectorPanel — Fase Editar

- Header: "Editar step {selectedStepId}"
- Pill tipo do step selecionado com cor correspondente
- Seção "VALOR DIGITADO": input com `step.value` + botão "Transformar em variável"
- Seção "SELECTOR · ORDENADOS POR ESTABILIDADE": radio buttons para cada selector
  - Radio selecionado = primeiro (recommended ou index 0)
- Seção "OPÇÕES": "Smart wait" com descrição

### InspectorPanel — Fase Salvar

- Header: "Salvar como Action"
- Texto info: "5 de 7 steps viram uma Action reutilizável. Para incluir mais, volte para Editar."
- Input "Nome da Action": valor "Fazer login"
- Input "Pasta": valor "Autenticação"
- Seção "PARÂMETROS DETECTADOS": texto explicativo
- Botão "Salvar Action" (verde, largura total)

---

## Estados

- `recorderPhase`: 'gravar' | 'editar' | 'salvar' — lido do store
- `selectedStepId`: número do step ativo (fase Editar)
- Steps da fase Gravar: apenas step 1
- Steps das fases Editar/Salvar: todos os 7

---

## Interações

1. Clicar em fase na PhasesBar → `setRecorderPhase(fase)`
2. Botão "Finalizar" na fase Gravar → `setRecorderPhase('editar')`
3. Clicar em step na fase Editar → `setSelectedStep(id)` → painel direito mostra "Editar step N"
4. Checkboxes dos steps: estado visual (não persiste no store neste protótipo)
5. Botão "Pausar": visual apenas

---

## Critérios de aceitação

- [ ] `npm run format && npm run lint && npm run typecheck:app` sem erros
- [ ] PhasesBar muda de aparência conforme fase ativa
- [ ] Fase Gravar mostra 1 step + inspector com selectors
- [ ] Fase Editar mostra 7 steps + painel editar step com selectors como radio
- [ ] Fase Salvar mostra 7 steps + formulário de salvar action
- [ ] Clicar em step na fase Editar atualiza painel direito
- [ ] DeviceFrame mostra tela correta por fase
- [ ] Sem imports de dependências inexistentes

---

## Fora de escopo

- Conexão real com ADB, Appium ou dispositivos
- Persistência real dos valores dos inputs
- Execução de steps no device
