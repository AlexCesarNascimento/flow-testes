# Recorder — inspeção visual dos steps

## Propósito e referência

Adaptar a revisão do Chrome Recorder às gravações Android do FlowTest: detalhes expansíveis, evidências visuais da tela e JSON inspecionável. Referência: imagens locais `artifacts/image copy.png` e `artifacts/image copy 2.png` e [Chrome Recorder — Features reference](https://developer.chrome.com/docs/devtools/recorder/reference), consultada em 28/09/2026.

## Escopo e contratos

- Cada step tem accordion independente e acessível por teclado, com tipo, valor, seletores e estabilidade, assinatura de tela quando disponível, resultado e timeout. A lista oferece expandir/recolher todos. IDs continuam estáveis; numeração visual segue a ordem.
- Screenshots são capturadas do frame espelhado ao registrar uma tela reconhecida. Nenhum comando ADB adicional é enviado para obter a imagem. Miniatura junto à tela abre visualização ampliada; gravações antigas ou sem vídeo mostram “Sem captura”. A imagem é evidência aproximada do frame disponível na observação, não uma garantia de sincronismo com o XML Android.
- Evidências ficam em memória da sessão, com limite de 40 imagens de até 720 px no lado maior e 180 KB por imagem. Ao remover/limpar steps, remover suas evidências; ao recarregar a aplicação, não restaurá-las. Isso evita inflar o localStorage e o JSON de automação. A UI explicita o caráter temporário e permite baixar a imagem. Não simular imagens quando o device estiver ausente.
- “Mostrar código” abre o JSON FlowTest em painel adaptável ao espaço, somente leitura, atualizado por edição. Oferece fluxo inteiro/step selecionado, copiar e baixar. Exportador e visualizador usam o mesmo contrato; valores de dataset não são interpolados. Screenshots não entram no JSON.
- Complementos desta etapa: timeout opcional por step (1–120 s, distinto do delay máximo), copiar JSON de um step, copiar seletor e indicação de identidade ausente. O timeout configura o limite total da ação, respeitando cancelamento; sem override preserva os limites existentes. Export/import v1.2.0 preserva timeout e aceita gravações v1 anteriores.
- O Play principal continua executando a lista inteira. Expandir e selecionar um step não filtram a execução. Não implementar controles aparentes sem comportamento.

## Componentes e estados

- `StepsPanel`: composição da lista, seleção, accordions e visualizador de código.
- Componentes locais do widget: detalhes do step, captura ampliada e código. Estilos SCSS/BEM com tokens existentes.
- Provider de snapshot compartilhado: recebe canvas do espelhamento, devolve JPEG reduzido apenas quando há stream; não cruza dependências entre features.
- Store de evidências separada do conteúdo persistido. Captura falha silenciosamente para a automação, mostrando ausência de imagem na revisão.
- Vazio: orientação para iniciar/importar gravação; JSON válido com zero steps. Carregando: seletor pendente continua indicado. Erro: cópia falha com mensagem local; timeout inválido não altera o step; falha do playback permanece visível. Sucesso: detalhes e código refletem o estado atual.

### Ajuste visual solicitado: tracking minimalista

Referência adicional: `artifacts/image copy 4.png`. Organizar a lista em trechos iniciados pelo reconhecimento de tela, com uma miniatura por trecho, linha vertical fina e marcadores por step. Manter todos os steps executáveis na sequência original. Na linha recolhida, mostrar ação/alvo, resumo discreto do delay máximo, checkbox e alça de reordenação junto ao marcador. Edição de delay fica no accordion. Erro aparece junto ao marcador vermelho e abaixo do step; seleção e execução usam destaque discreto. Preservar tema escuro e tokens do FlowTest.

Correção de usabilidade: alça de arrastar sempre visível junto ao marcador azul, checkbox visível na linha e ícone com cor própria para cada tipo de ação. Separar trechos de telas por linha horizontal. A expansão continua reservada para seletores, timeout e edição de delay. O sidesheet de gravação mostra estado real do device/captura, tela atual e qualidade da identidade do step selecionado, sem classe Android fictícia nem duplicação da lista de seletores.

## Aceitação e validação

1. Expandir por mouse/teclado mostra seletores sem coordenadas e não aciona Play; edição de timeout reflete no JSON e export/import.
2. Captura real usa canvas do device; teste Electron usa canvas e Android simulados, identificados como tal. Miniatura pode abrir, fechar com Escape e baixar; stop/reload/remoção não apresentam evidências de outro step.
3. JSON completo e de step são válidos, incluem assinatura/delay/timeout e mantêm `{{variavel}}`. Copiar/baixar têm ações reais.
4. Timeout personalizado encerra ação travada e impede os próximos steps. Regressões anteriores de playback continuam passando.
5. Validar DOM, console, screenshots e layout no Electron; format, lint, TypeScript, testes proporcionais, validate e build. Limitação explícita: não certificar device físico por testes simulados.

## Fora desta etapa

Breakpoints com retomada, replay lento e exportação para runners externos requerem alterações próprias no executor. Persistência de screenshots e agrupamento recolhível por tela podem ser evoluções posteriores; a lista atual deve manter a sequência completa visível.
