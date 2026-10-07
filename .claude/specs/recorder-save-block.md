# Recorder — salvar bloco em Flows

## Propósito

Após configurar um step ou sequência, salvar um bloco reutilizável e encontrá-lo em Flows. Hoje existe um store de Actions e uma etapa de salvamento, mas Flows apresenta uma biblioteca estática vazia; falta uma ação de salvamento junto aos steps.

## Contrato e interações

- Botão “Salvar bloco” na lista salva a gravação inteira; botão nos detalhes salva apenas aquele step. O formulário informa a quantidade, permite nome e pasta e só salva nomes não vazios e steps finalizados. Captura/playback em curso desabilita salvamento.
- Reutilizar `useActionStore`: snapshot independente dos steps, mantendo seletores, assinatura, variáveis, delay e timeout. Não incluir imagem, seleção ou resultado transitório. ID único por bloco. Formulário mostra erro se persistência falhar e não navega.
- Ao salvar, navegar para `/flows?bloco=<id>`. Flows lê Actions reais, mostra o bloco na biblioteca e seleciona seus detalhes no centro: steps, seletores e parâmetros. Busca filtra por nome/pasta. Reload mantém a biblioteca e a seleção pela URL.
- O salvamento já existente no Inspector também deve levar ao bloco salvo. Apenas steps incluídos determinam parâmetros.
- Não apresentar o canvas de demonstração como execução real; composição/execução de Flows é outra etapa.

## Estados e aceitação

- Vazio: biblioteca orienta gravar um bloco; detalhes pedem seleção.
- Editando: nome/pasta e quantidade visíveis, cancelar preserva recorder; Enter salva pelo formulário, Escape fecha.
- Sucesso: bloco presente em Flows com propriedades corretas e persistência após reload. Alterações posteriores no recorder não alteram o snapshot salvo.
- Erro: mensagem local sem redirecionar e sem perda da gravação.
- Validar fluxo completo no Electron com steps simulados, salvamento de um step e da sequência, parâmetros e persistência; build/check e inspeção visual.
