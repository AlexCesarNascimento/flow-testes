# Recorder — leitura resiliente da hierarquia Android

## Propósito

Corrigir falha relatada no terceiro step: a tela está visível no device, mas o Play informa “Hierarquia da tela indisponível”. A mensagem atual resulta de dump sem `<node>` ou arquivo lido sem XML válido; o recorte do usuário não identifica a causa exata.

## Contrato

- Cada leitura usa arquivo único e remove apenas o próprio arquivo. Dumps do mesmo device são serializados para evitar sessões `uiautomator` concorrentes entre captura e playback.
- O dump padrão é conferido. Se retornar árvore sem nós, fazer uma única tentativa com `uiautomator dump --verbose` no mesmo ciclo, porque a árvore padrão pode omitir views não importantes.
- Falha transitória da leitura não encerra imediatamente a espera de elemento/tela: polling repete dentro do timeout total existente, respeitando cancelamento e prazo. Não reutilizar XML anterior nem avançar o step sem hierarquia válida.
- Se o prazo acabar com leituras indisponíveis, mostrar que a hierarquia não pôde ser lida; se houver leituras válidas mas alvo ausente, manter erro de alvo/tela não encontrados. Não expor XML, textos sensíveis ou conteúdo de campos em logs/erros.
- Timeout de um dump considera a espera de idle do Android; o prazo global do step continua limitando a operação. Erro de device desconectado ou cancelamento interrompe.

## Estados e aceitação

- Sucesso: dump padrão válido ou leitura verbose válida; seletor/tela revalidado normalmente.
- Transitório: dump vazio seguido de válido antes do prazo permite o step 3 avançar.
- Erro: árvore permanentemente vazia falha com causa clara, sem executar o próximo step.
- Cancelado: encerra leitura e fila sem callback tardio.
- Testes Node simulam árvore padrão vazia, fallback verbose, falha persistente e concorrência. Electron simulado cobre terceiro step com leitura inicial vazia e recuperação. Device real exige reexecução do fluxo relatado.
