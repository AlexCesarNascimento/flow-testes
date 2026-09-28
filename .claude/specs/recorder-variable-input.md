# Recorder — vincular variável ao campo

## Propósito

Corrigir o fluxo relatado de adicionar variável sem atualizar o input. A imagem posterior mostra o step 24 `Digitar {{agencia}}` com status `Falhou`, mas não mostra o erro detalhado; a causa concreta no device não pode ser inferida somente do recorte.

## Evidência e contrato

O campo “Valor digitado no step” usa defaultValue e não persiste alterações. Após vincular outra coluna, o store muda, mas o input já montado mantém o valor anterior. O botão “Transformar valor em variável” não tem interação.

O valor exibido deve acompanhar Step.value, incluindo vínculo, edição e troca do step selecionado. Editar esse campo atualiza o step inputText, mantendo seletores e delay. O botão de variável leva o foco à seleção de colunas existente. Selecionar coluna grava o template {{coluna}}, nunca o valor concreto da massa; o playback resolve a linha ativa no momento da execução.

## Estados e aceitação

- Sem step: permanece a orientação para selecionar um step.
- Sem colunas: orientar criação em Dados; não inventar valores.
- Vínculo: template visível e persistido, seletores do alvo preservados.
- Edição: valor controlado acompanha o store e troca de step não reaproveita valor anterior.
- Playback: regressão com campo identificado e ID repetido deve focar o alvo correto e enviar o valor da massa ativa; sem dados válidos deve mostrar falha, sem digitar template literal.
- Validação em Electron com Android simulado; não representa execução bem-sucedida no aparelho físico.

## Execução de variável

Antes de digitar, validar que todas as colunas citadas existem e têm valor não vazio na massa ativa; a mensagem de falha informa coluna, dataset e linha, sem revelar valores. Quando o step não tem seletor de destino, aguardar um único EditText habilitado e focado por até 5 s antes de enviar `input text`. Falha de foco mostra ação de correção, não marca sucesso. Quando há seletor, o executor localiza e toca o elemento semanticamente antes da digitação. A mensagem de falha fica visível no próprio step para que o motivo não se perca em listas longas. O dump de hierarquia reconhece o atributo `focused` do Android.

Regressão: step `Digitar {{agencia}}` sem seletor e massa vazia falha sem enviar texto; preencher a massa e executar novamente com campo focado envia o valor. Teste separado confirma que campo sem foco não libera a digitação.
