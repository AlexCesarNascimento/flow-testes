import {
  resolveUiElement,
  UiTargetError,
  type UiElement,
} from '../../../shared/lib/ui-hierarchy/index.ts';
import { UiHierarchyUnavailableError } from '../../../shared/lib/adb-ui/index.ts';
import { pollUntil, PollTimeoutError } from './pollUntil.ts';

export async function waitForTarget(
  selectors: { type: string; value: string }[],
  read: (signal: AbortSignal) => Promise<UiElement[]>,
  signal: AbortSignal,
  report?: (message: string) => void,
  timeoutMs = 15_000,
): Promise<UiElement> {
  if (
    !selectors.some((s) =>
      ['resourceId', 'accessibilityId', 'text'].includes(s.type),
    )
  ) {
    return resolveUiElement([], selectors);
  }
  let last: UiElement | null = null;
  let attempts = 0;
  const readState = {
    validReads: 0,
    hierarchyError: null as UiHierarchyUnavailableError | null,
  };
  try {
    return await pollUntil(
      async (pollSignal) => {
        report?.(
          `Aguardando elemento único e estável — leitura ${++attempts} (até ${timeoutMs / 1000} s).`,
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
          last = null;
          return undefined;
        }
        readState.validReads++;
        let target: UiElement;
        try {
          target = resolveUiElement(elements, selectors);
        } catch (error) {
          if (!(error instanceof UiTargetError) || error.code !== 'missing')
            throw error;
          last = null;
          return undefined;
        }
        if (!target.enabled) {
          last = null;
          return undefined;
        }
        if (
          last &&
          target.bounds.every((value, index) => value === last!.bounds[index])
        )
          return target;
        last = target;
        return undefined;
      },
      signal,
      timeoutMs,
      'Timeout: elemento não apareceu habilitado e estável na tela atual.',
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
