# Recorder — validação de 28/09/2026

## Comportamento entregue

- Reconhecimento da tela por assinatura acessível, incluindo navegação dentro do mesmo pacote, com duas observações consecutivas.
- Progresso antes da ação, seleção e scroll para o step atual, resultados por step e interrupção em falha/cancelamento.
- Play executa todos os steps na ordem, independentemente das marcações; interrompe em erro ou cancelamento.
- Cronômetro ao lado do status, com congelamento ao terminar, e contagem regressiva do delay.
- Polling serial de elemento habilitado e estável em duas leituras, com prazo de 15 s e cancelamento.
- Delay editável até o próximo passo; gravação preenche o intervalo observado. Último step não aguarda delay.
- Seletores combinados no mesmo node: resource-id + accessibility-id + texto disponíveis. IDs repetidos de campos como agência/conta exigem correspondência única.
- Coordenadas de gravações antigas não são fallback de execução. Toques sem identidade são explicitamente não identificados; import/export removem esse fallback.
- TAP que parte do launcher padrão e abre um pacote identificado vira `launchApp`, seguido pelo reconhecimento da tela. O pacote é observado no destino, nunca deduzido pelo nome do ícone.
- Exportação v1.1 preserva assinatura e delay; arquivos antigos continuam importáveis para revisão.

## Evidências

| Comando                       | Resultado                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run validate`            | Aprovado: Prettier, ESLint, TypeScript tooling/renderer, 27 testes Node e 16 E2E do protótipo                                       |
| `npm run test:recorder`       | Aprovado: 8 regressões do recorder + 1 regressão específica de variável no Electron com renderer real e transporte Android simulado |
| `npm run build`               | Aprovado: main, preload e renderer                                                                                                  |
| `git diff --check`            | Aprovado                                                                                                                            |
| `node scripts/link-skills.ts` | Links de Claude e Codex confirmados; skill ecc-flowtest descoberta no catálogo da sessão                                            |

Os oito testes Electron cobrem progresso/delay/reconhecimento, cancelamento, device ausente, captura de transições com e sem toque, campo agência com ID repetido abertura de app pelo launcher, timeout de abertura sem resposta e execução da lista inteira mesmo quando apenas o primeiro step está marcado. O teste de agência altera os bounds e verifica que o comando usa o centro atual do campo identificado, sem reutilizar coordenadas gravadas.

O teste do cronômetro verifica avanço durante a execução e congelamento após concluir. A pesquisa do Chrome Recorder e sugestões pendentes estão em `docs/CHROME_RECORDER_RESEARCH.md`.

Screenshot inspecionada: `artifacts/recorder-playback-delay.png`. Inspeção interativa do renderer por Playwright MCP confirmou DOM e abertura/fechamento do formulário; a leitura final de console não retornou erros. O MCP no navegador não substitui os testes Electron acima.

## Correção de variável no input

O novo teste reproduziu a falha: após selecionar agencia, o store continha {{agencia}}, mas o input ainda mostrava o valor inicial. O campo agora é controlado pelo step, persiste edições e o botão de variável direciona o foco ao seletor existente. O teste aprovado também verifica resolução da massa ativa, foco por combinação de seletores com ID repetido e comando de digitação do valor resolvido.

Validação adicional: `npm run test:recorder -- --grep 'vincular variável'` aprovado (1 caso), `npm run check` e build aprovados. A primeira tentativa de check dentro do sandbox não iniciou o servidor do teste; foi repetida com a permissão necessária. A imagem referenciada pelo usuário não veio anexada; não há confirmação visual do erro no device real.

## Limitações e falhas resolvidas

A primeira validação geral apontou formatação em dois arquivos, corrigida antes da execução aprovada. As primeiras rodadas Electron expuseram disputa de USB real e uma asserção que perdia estados curtos; a fixture passou a simular USB antes de carregar o renderer e controlar a liberação da leitura da tela. Os testes não validam o aparelho físico nem o aplicativo bancário real enviado como exemplo.

A captura depende da hierarquia acessível fornecida pelo Android: telas muito rápidas entre dumps ou telas com âncoras idênticas podem exigir identificação específica. Aguarde a preparação inicial antes de tocar. Um step antigo contendo apenas coordenadas não permite reconstruir a identidade com segurança e precisa ser recapturado. Swipes continuam sem execução implementada e falham explicitamente.

O transporte existente é ADB/WebUSB. Wi-Fi requer uma entrega própria no main/preload, com pareamento e transporte de rede; não foi implementado nesta etapa. Nenhuma permissão de produção foi ampliada.

## Skills e preservação do trabalho existente

ECC 2.2.2 foi consultado no cache instalado do Claude. As orientações relevantes de frontend-patterns, e2e-testing e verification-loop foram adaptadas em `.codex/skills/ecc-flowtest`, com origem e licença. `.agents/skills` e `.claude/skills` compartilham esse diretório. Não foi instalado o conjunto completo de hooks/agents/scripts ECC.

O microcommit inicial de documentação/skills é `955a5b7`. A implementação foi integrada sobre arquivos que já tinham alterações e módulos ainda não versionados do usuário; essas mudanças permanecem no working tree para não incluir trabalho preexistente em um commit desta tarefa. O baseline e o diff de revisão local estão em `.cache/recorder-baseline` e `.cache/recorder-review`. Configurações preexistentes e alterações simultâneas em `.codex/config.toml` foram preservadas.
