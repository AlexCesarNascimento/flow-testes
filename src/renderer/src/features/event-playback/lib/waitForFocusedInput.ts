import type { UiElement } from '../../../shared/lib/ui-hierarchy/index.ts';
import { UiHierarchyUnavailableError } from '../../../shared/lib/adb-ui/index.ts';
import { pollUntil, PollTimeoutError } from './pollUntil.ts';

/** Não envia texto a um campo desconhecido quando o step não tem seletor. */
export async function waitForFocusedInput(
  read: (signal: AbortSignal) => Promise<UiElement[]>,
  signal: AbortSignal,
  report?: (message: string) => void,
  timeoutMs = 5_000,
): Promise<UiElement> {
  const readState = {
    validReads: 0,
    hierarchyError: null as UiHierarchyUnavailableError | null,
  };
  try {
    return await pollUntil(
      async (pollSignal) => {
        report?.(
          `Aguardando um campo de texto focado (até ${timeoutMs / 1000} s).`,
        );
        let elements: UiElement[];
        try {
          elements = await read(pollSignal);
          if (!elements.length)
            throw new UiHierarchyUnavailableError(
              'A hierarquia Android não contém elementos utilizáveis.',
            );
        } catch (error) {
          if (
            !(error instanceof UiHierarchyUnavailableError) ||
            pollSignal.aborted
          )
            throw error;
          readState.hierarchyError = error;
          return undefined;
        }
        readState.validReads++;
        const focused = elements.filter(
          (element) => element.editable && element.enabled && element.focused,
        );
        return focused.length === 1 ? focused[0] : undefined;
      },
      signal,
      timeoutMs,
      'Nenhum campo de texto focado. Selecione o campo no app antes da variável ou informe seu seletor.',
    );
  } catch (error) {
    if (
      error instanceof PollTimeoutError &&
      readState.validReads === 0 &&
      readState.hierarchyError
    )
      throw new UiHierarchyUnavailableError(
        `Timeout: ${readState.hierarchyError.message}`,
        { cause: readState.hierarchyError },
      );
    throw error;
  }
}
