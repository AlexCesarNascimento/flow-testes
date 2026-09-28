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
