# Recorder — vincular variável ao campo

## Propósito

Corrigir o fluxo relatado de adicionar variável sem atualizar o input. A referência à imagem chegou sem anexo; distinguir a edição no FlowTest da digitação no device durante a reprodução.

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
