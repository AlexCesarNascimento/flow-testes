# Recorder — antecipar delay quando o próximo step estiver pronto

## Propósito

Reduzir esperas gravadas quando o próximo componente ou tela fica pronto antes do limite. Exemplo: `Abrir app` com delay de 10 s seguido de `Reconhecer tela`: se a assinatura é confirmada em 2 s, iniciar o reconhecimento em 2 s.

## Contrato

- `delayAfterMs` continua a ser o valor exportado/editável, interpretado no Play como prazo máximo antes do próximo step.
- Após sucesso do step atual, observar a condição do próximo step durante o delay. Para tela com assinatura, exigir duas leituras consecutivas iguais. Para tap/longPress/inputText com seletores semânticos, exigir elemento único, habilitado e bounds estáveis em duas leituras. Para inputText sem seletor, aguardar um único campo editável focado.
- Se a condição ficar pronta, encerrar o delay e iniciar o próximo step imediatamente. O próprio step deve revalidar sua condição antes da ação para evitar usar leitura antiga.
- Se não ficar pronta até o prazo, iniciar o próximo step mesmo assim; ele aplica seu timeout normal e mostra falha real se necessário. Falha transitória da sondagem não marca o step anterior como falho nem estende o delay.
- Steps sem condição observável (abrir app, tipo não suportado e reconhecimento legado apenas por pacote) preservam a espera integral. Delay zero não espera. Último step nunca espera.
- Cancelamento encerra delay/sondagem e impede o próximo step. Nenhum dump paralelo de uma mesma sondagem; não usar coordenadas gravadas.

## Estados e aceitação

- Executando: step atual passa, contagem regressiva mostra o máximo restante.
- Condição antecipada: estado de espera termina antes do valor configurado; próximo step entra em execução e depois passa/falha normalmente.
- Prazo encerrado: a execução avança sem somar espera além do delay; próximo step valida sua condição.
- Não observável: aguarda o delay configurado.
- Cancelado: próximo step não começa.
- Testes Node cobrem prazo e antecipação; teste Electron com Android simulado comprova avanço anterior ao delay. Device físico exige medição separada da latência do dump.
