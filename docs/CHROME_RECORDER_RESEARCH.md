# Chrome Recorder: aplicações no FlowTest

Pesquisa em 28/09/2026 na documentação e no código oficiais. As decisões para Android abaixo são adaptações propostas para o FlowTest, não garantias de comportamento do Chrome no device.

## Como funciona

A captura do Chrome é orientada a eventos: pointerdown, click, teclado e input. O cliente preserva o alvo e seus seletores no início da interação, antes de mudanças no documento. Fonte: [RecordingClient.ts](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/panels/recorder/injected/RecordingClient.ts).

Na reprodução via Puppeteer Replay, ações usam locators e prazo limitado. As expectativas de navegação são registradas antes da ação. O helper de waitForElement verifica repetidamente a condição, com intervalo de 100 ms e timeout. Esse intervalo pertence àquela implementação; não significa que toda captura do Recorder dependa de polling. Fonte: [PuppeteerRunnerExtension.ts](https://github.com/puppeteer/replay/blob/main/src/PuppeteerRunnerExtension.ts).

Os locators do Puppeteer verificam condições como visibilidade, habilitação e estabilidade da posição em dois frames. Fonte: [Page interactions](https://pptr.dev/guides/page-interactions).

O Recorder permite timeout por fluxo/step, asserts de elementos, replay lento e breakpoints. No modo normal reproduz o mais rápido possível. Fonte: [Features reference](https://developer.chrome.com/docs/devtools/recorder/reference).

## Aplicação nesta entrega

- Captura usa o snapshot anterior ao toque para identificar o alvo e observa mudanças de tela independentemente de novos toques.
- Playback procura o elemento novamente pela identidade semântica: combinação única de ID, acessibilidade e texto. Nunca usa a coordenada gravada como fallback.
- Polling serial de elementos e telas: intervalo de 500 ms após cada leitura terminar, deadline de 15 s e cancelamento. Dumps Android são operações diferentes das consultas ao DOM; o intervalo deve ser medido no device antes de ser reduzido.
- Antes da ação, aguarda elemento habilitado e bounds iguais em duas leituras consecutivas. Isso não prova ausência de overlays ou toda a visibilidade que o navegador consegue avaliar.
- Elemento ausente pode aparecer nas leituras seguintes. Seletor ambíguo, falta de identidade e erro de transporte interrompem explicitamente a execução.
- Cronômetro total, motivo da espera e contagem de leituras; delay intencional mostra contagem regressiva. O comando de abrir app tem prazo de 10 s, seguido pelo step de reconhecimento quando gravado.
- O Play principal executa a lista inteira, mesmo quando apenas um step está marcado. A seleção não filtra a execução.

## Próximas sugestões, ainda não implementadas

1. Timeout editável por step e evidência de falha: última assinatura observada e screenshot, com cuidado para não persistir dados sensíveis sem intenção.
2. Breakpoints e executar até um step, úteis para investigar login e navegação.
3. Separar delay voluntário de duração humana de gravação: oferecer modo rápido por condições e modo com os delays gravados. Não alterar automaticamente os delays existentes.
4. Captura semântica de digitação e eventos de navegação via acessibilidade/instrumentação do app. Para React Native, testID/accessibilityLabel ajudam a expor identidades; não basta observar apenas activity ou package, pois várias telas usam os mesmos.
5. Medir latência dos dumps no device e só então considerar frequência adaptativa. Um serviço de eventos Android exigiria arquitetura, permissões e instalação próprias.

## Caso “Abrir app Itaú”

Foi encontrado um filtro no Play que executava apenas os steps marcados, quando havia seleção. O usuário confirmou que deseja executar sempre a lista inteira; esse filtro foi removido. Há regressões com transporte simulado para continuação após a abertura mesmo com apenas o primeiro step marcado, timeout da abertura e abertura normal seguida de reconhecimento. Validar o cenário bancário em device físico continua necessário; testes simulados não certificam esse fluxo real.
