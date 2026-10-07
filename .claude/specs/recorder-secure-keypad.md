# Recorder — senha em teclado numérico dinâmico

## Propósito

Uma tela de senha nativa apresenta cinco botões cujos rótulos são pares de dígitos, como “0 ou 1”. A associação entre `btn1`–`btn5` e os dígitos muda entre entradas. Reproduzir os toques gravados por `resource-id` digitaria outra senha; alguns toques sequer têm identidade. O usuário deve informar uma variável de dataset, e o Play deve localizar o par atual de cada dígito antes de tocar.

## Contrato e escopo

- Novo tipo `secureKeypad` no recording v1.3.0. `value` é **somente** uma referência completa `{{coluna}}`; JSON importado com senha literal nesse tipo é rejeitado. `label`, progresso e erros não exibem o valor resolvido. O valor da massa fica no dataset existente; esta etapa não altera sua persistência.
- A tela compatível tem, no mesmo pacote, cinco elementos com `resource-id` terminado em `/btn1`…`/btn5`, cada um com texto ou descrição no formato `D ou D` (ou `D or D`), todos habilitados, cobrindo os dígitos 0–9 uma única vez. Os bounds do XML atual determinam o centro do toque. Não reutilizar posição, rótulo nem ID gravados para escolher o dígito.
- Para cada dígito, fazer nova leitura de hierarquia. Se o teclado estiver ausente, incompleto ou ambíguo, aguardar dentro do prazo; nunca escolher um botão arbitrário. Cancelamento e timeout interrompem a sequência; falha não avança para `Continuar`.
- O step pode ser adicionado manualmente a partir do seletor de tipo. Num reconhecimento de tela que contém `btns_keyboard` e `btn1`–`btn5`, o accordion oferece converter a sequência seguinte de toques do teclado em um único step. A conversão encerra no primeiro toque com outro seletor (por exemplo, `Continuar`) ou outro tipo de step; não deduz a senha a partir dos toques antigos. Exige selecionar coluna existente, mostra quantos toques serão substituídos e mantém os demais steps.
- Na UI, mostrar apenas `{{coluna}}`, nunca os dígitos do dataset. Valor da variável é validado como sequência de 1–16 dígitos no início do Play. Para este tipo, prazo padrão de 60 s, editável até 120 s; o timeout engloba todos os toques.

## Estados e aceitação

- Vazio: sem coluna de dataset, a opção informa onde criar uma; não cria step incompleto.
- Carregando: progresso informa posição atual sem revelar dígito; Play pode ser cancelado.
- Erro: variável ausente/não numérica, hierarquia indisponível, pares incompletos/ambíguos e timeout terminam o step com mensagem sem valor secreto; próximos steps não executam.
- Sucesso: cada posição gera um toque no botão cujo **texto atual** contém o dígito. Repetições de dígitos funcionam; uma nova disposição entre leituras muda as coordenadas usadas. Export/import preserva a referência da variável, sem incluir seu valor.
- Testes unitários cobrem mapeamento, validação e ambiguidade; teste Electron simulado cobre UI de conversão e playback de dígitos repetidos com embaralhamento, além da interrupção por falha.
