# Recorder — validação de 28/09/2026

## Comportamento entregue

- Reconhecimento da tela por assinatura acessível, incluindo navegação dentro do mesmo pacote, com duas observações consecutivas.
- Progresso antes da ação, seleção e scroll para o step atual, resultados por step e interrupção em falha/cancelamento.
- Play executa todos os steps na ordem, independentemente das marcações; interrompe em erro ou cancelamento.
- Cronômetro ao lado do status, com congelamento ao terminar, e contagem regressiva do delay.
- Polling serial de elemento habilitado e estável em duas leituras, com prazo de 15 s e cancelamento.
- Delay editável como limite máximo até o próximo passo; tela/elemento pronto pode antecipar a execução. Gravação preenche o intervalo observado. Último step não aguarda delay.
- Seletores combinados no mesmo node: resource-id + accessibility-id + texto disponíveis. IDs repetidos de campos como agência/conta exigem correspondência única.
- Coordenadas de gravações antigas não são fallback de execução. Toques sem identidade são explicitamente não identificados; import/export removem esse fallback.
- TAP que parte do launcher padrão e abre um pacote identificado vira `launchApp`, seguido pelo reconhecimento da tela. O pacote é observado no destino, nunca deduzido pelo nome do ícone.
- Exportação v1.1 preserva assinatura e delay; arquivos antigos continuam importáveis para revisão.

## Evidências

| Comando                       | Resultado                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run validate`            | Aprovado: Prettier, ESLint, TypeScript tooling/renderer, 30 testes Node e 16 E2E do protótipo            |
| `npm run test:recorder`       | Aprovado: 12 regressões Electron do recorder no Electron com renderer real e transporte Android simulado |
| `npm run build`               | Aprovado: main, preload e renderer                                                                       |
| `git diff --check`            | Aprovado                                                                                                 |
| `node scripts/link-skills.ts` | Links de Claude e Codex confirmados; skill ecc-flowtest descoberta no catálogo da sessão                 |

Os testes Electron cobrem progresso/delay/reconhecimento, cancelamento, device ausente, captura de transições com e sem toque, campo agência com ID repetido, abertura de app pelo launcher, timeout de abertura sem resposta e execução da lista inteira mesmo quando apenas o primeiro step está marcado. O teste de agência altera os bounds e verifica que o comando usa o centro atual do campo identificado, sem reutilizar coordenadas gravadas.

O teste do cronômetro verifica avanço durante a execução e congelamento após concluir. A pesquisa do Chrome Recorder e sugestões pendentes estão em `docs/CHROME_RECORDER_RESEARCH.md`.

Screenshot inspecionada: `artifacts/recorder-playback-delay.png`. Inspeção interativa do renderer por Playwright MCP confirmou DOM e abertura/fechamento do formulário; a leitura final de console não retornou erros. O MCP no navegador não substitui os testes Electron acima.

## Correção de variável no input

O novo teste reproduziu a falha: após selecionar agencia, o store continha {{agencia}}, mas o input ainda mostrava o valor inicial. O campo agora é controlado pelo step, persiste edições e o botão de variável direciona o foco ao seletor existente. O teste aprovado também verifica resolução da massa ativa, foco por combinação de seletores com ID repetido e comando de digitação do valor resolvido.

Validação final: `npm run test:recorder` com 12 casos, `npm run validate` com 30 testes Node e 16 E2E do protótipo, e `npm run build` aprovados. A primeira tentativa de check dentro do sandbox não iniciou o servidor do teste; foi repetida com a permissão necessária. Uma imagem posterior mostrou o step 24 `Digitar {{agencia}}` com status “Falhou”, sem a mensagem de erro. A causa exata no device real segue sem confirmação. O erro agora aparece junto ao step; massa vazia e ausência de foco têm mensagens distintas.

## Limitações e falhas resolvidas

A primeira validação geral apontou formatação em dois arquivos, corrigida antes da execução aprovada. As primeiras rodadas Electron expuseram disputa de USB real e uma asserção que perdia estados curtos; a fixture passou a simular USB antes de carregar o renderer e controlar a liberação da leitura da tela. Os testes não validam o aparelho físico nem o aplicativo bancário real enviado como exemplo.

A captura depende da hierarquia acessível fornecida pelo Android: telas muito rápidas entre dumps ou telas com âncoras idênticas podem exigir identificação específica. Aguarde a preparação inicial antes de tocar. Um step antigo contendo apenas coordenadas não permite reconstruir a identidade com segurança e precisa ser recapturado. Swipes continuam sem execução implementada e falham explicitamente.

O transporte existente é ADB/WebUSB. Wi-Fi requer uma entrega própria no main/preload, com pareamento e transporte de rede; não foi implementado nesta etapa. Nenhuma permissão de produção foi ampliada.

## Teclado numérico de senha dinâmica — 29/09/2026

O login com cinco botões que exibem pares de números não pode ser reproduzido pelos IDs `btn1`–`btn5` gravados: o par associado a cada ID muda. O novo step `secureKeypad` recebe apenas uma referência `{{coluna}}` do dataset. Antes de cada dígito, lê a hierarquia atual, exige os cinco pares únicos cobrindo 0–9 e toca o centro do botão que contém aquele dígito. Uma leitura incompleta ou ambígua não gera toque; timeout, erro e cancelamento impedem o próximo step. O prazo padrão para a sequência é 60 s.

O dataset atual ainda persiste seus valores em localStorage. Esta entrega evita incluir a senha no step/JSON exportado, mas não cria armazenamento secreto para a massa; usar credenciais de teste até existir um cofre ou entrada efêmera própria.

No accordion da tela de senha, o usuário escolhe a coluna e substitui os toques consecutivos do teclado, inclusive toques sem identidade, preservando o botão seguinte como “Continuar”. A UI informa previamente quantos toques serão substituídos. O step não deduz a senha gravada; a massa ativa fornece o valor no Play. O rótulo e o JSON exibem somente `{{coluna}}`. A versão de exportação é 1.3.0; importação de gravações v1 anteriores segue aceita, mas senha literal em `secureKeypad` é recusada.

O nome de exibição da tela passa a preferir título/texto legível a controles como “voltar” e “Fechar”; isso não altera a comparação da assinatura. O exemplo do usuário continua exigindo teste no aparelho real, pois as validações de teclado/ADB foram feitas com hierarquia Android simulada.

Validação final desta etapa: `npm run test:recorder` com 22 casos Electron, `npm run validate` com Prettier, ESLint, dois TypeScript checks, 43 testes Node e 16 E2E do protótipo, `npm run build` para main/preload/renderer e `git diff --check`, todos aprovados. O teste Electron simula embaralhamento após cada toque, verifica a sequência de centros atualizados, impede avanço com variável não numérica e confirma que o JSON exporta apenas a referência.

Após uma inspeção da screenshot `artifacts/recorder-secure-keypad.png`, a conversão passou a recolher a tela anterior e abrir o novo step, evitando oferecer uma segunda conversão com zero toques. O teste Electron direcionado e `npm run check` passaram após esse ajuste; o build foi repetido com sucesso.

## Skills e preservação do trabalho existente

ECC 2.2.2 foi consultado no cache instalado do Claude. As orientações relevantes de frontend-patterns, e2e-testing e verification-loop foram adaptadas em `.codex/skills/ecc-flowtest`, com origem e licença. `.agents/skills` e `.claude/skills` compartilham esse diretório. Não foi instalado o conjunto completo de hooks/agents/scripts ECC.

O microcommit inicial de documentação/skills é `955a5b7`. A implementação foi integrada sobre arquivos que já tinham alterações e módulos ainda não versionados do usuário; essas mudanças permanecem no working tree para não incluir trabalho preexistente em um commit desta tarefa. O baseline e o diff de revisão local estão em `.cache/recorder-baseline` e `.cache/recorder-review`. Configurações preexistentes e alterações simultâneas em `.codex/config.toml` foram preservadas.

## Revisão visual da trilha e telas nativas — 29/09/2026

A trilha foi compactada em grupos por tela, com miniatura e separador horizontal no início de cada novo grupo. Checkbox de seleção em lote e alça de reordenação ficam visíveis ao lado do marcador azul. Ícones coloridos identificam o tipo de ação. O sidesheet de gravação mostra estado real do device e da captura, tela associada ao step, existência de miniatura e qualidade do melhor seletor; os detalhes completos continuam no accordion do step. A seleção pelo checkbox não filtra o Play, que executa a lista inteira.

Nas telas Android nativas, a assinatura agora inclui ID, texto e descrição acessível do mesmo node, quando estáveis, sem usar conteúdo de campos editáveis. Assim, títulos diferentes com IDs reutilizados podem produzir um novo step `waitForPage`. A ordem visual da hierarquia é preservada para nomear a tela pelo primeiro texto; a comparação da assinatura continua independente da ordem. Duas leituras consecutivas ainda são necessárias para confirmar uma mudança.

Evidências: screenshot inspecionada em `artifacts/recorder-minimal-timeline.png`; `npm run validate` aprovado (Prettier, ESLint, TypeScript, 39 testes Node e 16 E2E); `npm run build` aprovado para main, preload e renderer. Na suíte Electron, 19 casos passaram na primeira rodada; o caso novo de tela nativa revelou um rótulo incorreto (“Continuar” em vez do título). Após corrigir a ordem das âncoras, os testes direcionados da transição nativa e do arrasto/checkbox passaram (2/2). O teste Electron usa Android e canvas simulados; ainda falta validação em device físico com telas nativas reais.

## Delay inteligente

O Play agora sonda a condição do próximo step durante o delay, com polling serial e cancelável. Assinatura de tela precisa de duas leituras iguais; elemento precisa ser único, habilitado e estável. A condição pronta antecipa o próximo step, que revalida a condição antes da ação. Ausência da condição até o limite não aumenta o delay; tipos sem condição observável mantêm a espera integral. O rótulo da UI explicita “Delay máx.” e o cronômetro mostra o limite restante.

Regressões adicionais: testes Node para antecipação e espera integral sem condição, testes Electron com Android simulado para tela e botão prontos antes de 8 s, mais cancelamento durante a sondagem.

## Leitura da hierarquia no terceiro step

O relato identificou o terceiro step como o botão `account_info_container`: o Android mostrava a tela, mas o Play informava “Hierarquia da tela indisponível”. O diagnóstico exato no aparelho físico segue aberto. A leitura agora serializa dumps do mesmo device, usa arquivo próprio por tentativa e, quando o dump padrão vem vazio, tenta o modo detalhado (`uiautomator dump --verbose`). Uma árvore vazia transitória faz o polling repetir dentro do prazo do step. Se todas as leituras falharem, a mensagem continua indicando a hierarquia; se a árvore for válida mas o botão não aparecer, a falha é de seletor. Erro de transporte e cancelamento não viram sucesso nem são classificados como árvore vazia.

Validação: `npm run check` passou com 35 testes Node; `npm run test:e2e` passou com 16 cenários; `npm run build` compilou main, preload e renderer. O teste Electron simulado reproduziu uma leitura vazia antes do terceiro step e confirmou três steps concluídos com o toque pelo ID atual de `account_info_container`. A suíte Electron teve 12/13 aprovações na primeira rodada; o único erro foi `ENOSPC` ao salvar a screenshot final de outro teste, que passou isoladamente na repetição. A validação no device físico e no app do relato ainda é necessária.
