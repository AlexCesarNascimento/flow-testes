# Recorder — reconhecimento de tela e progresso de execução

## Propósito e escopo

Gravar um step `waitForPage` para a tela inicial e para cada nova assinatura estável observada durante a gravação, inclusive dentro do mesmo pacote/activity React Native. Mostrar o step em execução antes de enviar a ação ao device; interromper em falha ou cancelamento, sem declarar conclusão falsa.

## Contratos e componentes

- A assinatura versionada guarda pacote e âncoras da hierarquia acessível (resource-id, accessibility-id; texto como fallback). Não usa coordenadas, foco, valores de campos editáveis, relógio ou teclado como identidade.
- A captura observa os dumps periódicos independentemente de um novo toque. Duas observações consecutivas iguais confirmam uma transição. O reconhecimento é acrescentado depois da ação que navegou e antes das ações seguintes observadas. Observações que atravessam um gesto são descartadas para evitar ordenar uma tela antiga depois dele.
- `Step.screenSignature` opcional preserva fluxos antigos; exportação/importação mantém a assinatura e rejeita assinaturas inválidas. Steps antigos sem assinatura aguardam somente o pacote, explicitamente como compatibilidade legada.
- Playback espera correspondência da assinatura, com prazo e cancelamento; erro de dump, tela errada, device ausente ou tipo não implementado nunca contam como sucesso. Resultado estruturado distingue sucesso, falha e cancelamento; a API textual do inspector continua disponível.
- UI acompanha início/fim de cada step, seleciona e rola até o atual, mantém resultados por step e apresenta progresso acessível. Gravação é pausada ao executar; encerramento do painel cancela a execução.

## Estados

- Vazio: nenhum step; play informa que não há execução.
- Capturando: interação aparece imediatamente; assinatura aguarda estabilidade.
- Executando: step atual destacado, contador e resultado por item.
- Erro: falha visível no step; próximos steps não executam.
- Cancelado: interrompe a espera e não avança; não mostra “Concluído”.
- Sucesso: somente após todos os steps executados com sucesso.

## Limites e arquitetura

Reutilizar o transporte WebUSB existente sem ampliar IPC, permissões ou introduzir Node no renderer. A arquitetura alvo de ADB no main permanece uma migração separada. Reconhecimento é uma heurística da árvore acessível: telas visualmente distintas com âncoras idênticas e telas rápidas entre dumps podem não ser distinguíveis. Listas dinâmicas podem exigir seletores de tela específicos. Não prometer detecção universal por imagem. Testes usam hierarquias e transporte simulados, identificados como tal; device real exige validação separada.

## Aceitação

- Login → Home no mesmo pacote produz assinatura diferente e um único reconhecimento por transição estável; permanecer, digitar e mudar foco não duplicam steps.
- Tela errada do mesmo pacote não libera playback; timeout/falha/cancelamento impedem ações seguintes.
- Progresso começa antes de uma ação lenta, acompanha a seleção e preserva erro/conclusão.
- Parar/reiniciar captura invalida callbacks da sessão anterior.
- Round-trip JSON preserva assinaturas; gravações v1 antigas continuam legíveis.
- Testes proporcionais, TypeScript e build executados; evidências de UI e limites documentados.

## Delay entre passos

Por orientação do usuário, a lista exibe “Delay máx. até próximo” em segundos, editável entre 0 e 300 s, em vez de mostrar o instante da gravação. `Step.delayAfterMs` guarda milissegundos e é preservado no JSON v1.1. Captura preenche o delay do step anterior com o intervalo observado até o seguinte (limitado a 300 s); último step começa com zero. Fluxos antigos sem o campo usam zero. Playback usa o delay como limite máximo após sucesso: para tela ou elemento verificável, avança antes se a condição estiver pronta; para step sem condição observável, espera integralmente. O próximo step revalida antes da ação. Último step não espera. Cancelamento interrompe também esse intervalo. O tempo histórico permanece apenas como metadado legado de exportação.

## Seletores sem fallback por coordenadas

Correção após evidência enviada pelo usuário: toques sem identificação não gravam coordenadas em selectors nem as exibem como label. O step fica “Elemento não identificado — grave novamente” e não executa. Gravações legadas por coordenadas continuam importáveis para revisão, mas esse fallback é removido no import/export e recusado pelo executor. Coordenadas só existem transitoriamente para associar o evento físico a um node e para tocar o centro do node encontrado na hierarquia atual.

O playback combina resource-id, accessibility-id e texto no mesmo elemento; IDs repetidos (por exemplo dois campos editText) exigem uma combinação única. Agência e conta são distinguidas pelo texto disponível, sem usar posição, ordem do XML ou índice. Identidades contraditórias, ausentes ou ambíguas falham explicitamente. A UI avisa enquanto a primeira hierarquia ainda está sendo preparada; uma tela que não expõe dados de acessibilidade pode precisar de testID/accessibilityLabel no aplicativo testado.

## Abertura de app independente do ícone

Resolver o launcher padrão via intent HOME. Se um TAP com snapshot de origem nesse launcher for seguido por uma assinatura estável de outro pacote, converter o mesmo ID em `launchApp`, com `value` igual ao pacote observado (por exemplo `com.test`). Limpar seletores do ícone e preservar o delay. A execução abre o pacote pela intent LAUNCHER e depois reconhece a tela do app. A tela do launcher não gera pré-condição no fluxo. Se o launcher não puder ser resolvido, não adivinhar o pacote pelo rótulo. Links internos e transições entre apps que não partem do launcher continuam como interações normais. Package ID não é URI de deeplink; deeplinks para telas internas ficam fora desta entrega.

## Cronômetro e diagnóstico de espera

Novo pedido: mostrar cronômetro junto ao resultado da execução. Inicia em zero a cada play; continua contando durante ação, polling e delay; congela ao concluir, falhar ou cancelar. Durante delay mostra também o restante, sem anunciar cada décimo para leitores de tela. O Play principal executa todos os steps em ordem, independentemente das marcações. Separar delay intencional de espera por condição, com prazo e cancelamento. O caso enviado inclui delay de 113321 ms: esse intervalo deve ficar visível, sem alterar silenciosamente o valor escolhido pelo usuário.

## Polling inspirado no Chrome Recorder

Pesquisa e fontes em `docs/CHROME_RECORDER_RESEARCH.md`. Espera de elemento e assinatura usa polling serial com intervalo de 500 ms após leitura, deadline absoluto de 15 s e cancelamento inclusive se a leitura travar. Elemento ausente pode ser tentado novamente; elemento único precisa estar habilitado e apresentar bounds iguais em duas leituras consecutivas. Ambiguidade e erro de transporte falham sem escolher posição ou primeiro match. Progresso informa condição e contagem de leituras. Abertura de app informa prazo de 10 s para resposta do comando; ausência de resposta deve falhar e impedir próximos steps. Marcações não filtram o Play principal; somente a ação individual do inspector executa um único step. O relato do usuário identifica a abertura do Itaú como o step parado; a causa no device ainda depende de evidência real.

## Telas nativas com os mesmos IDs

Os componentes nativos às vezes reutilizam os mesmos `resource-id` em telas diferentes. A assinatura passa a considerar também o texto e a descrição de acessibilidade estáveis do mesmo node, mesmo quando ele já possui ID. Ignorar texto de campos editáveis e texto com números; deduplicar e exigir duas leituras iguais como antes. O teste simula duas telas nativas no mesmo pacote, com IDs idênticos e títulos diferentes; deve gravar reconhecimento novo sem precisar de gesto. Telas desenhadas sem rótulos acessíveis distintos ainda requerem instrumentação no app e não podem ser identificadas com segurança apenas pelo XML.
