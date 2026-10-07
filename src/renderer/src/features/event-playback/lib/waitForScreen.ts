import {
  sameScreen,
  type ScreenSignature,
} from '../../../shared/lib/screen-signature/index.ts';
import { UiHierarchyUnavailableError } from '../../../shared/lib/adb-ui/index.ts';
import { pollUntil, PollTimeoutError } from './pollUntil.ts';

export async function waitForScreen(
  expected: ScreenSignature,
  read: (signal: AbortSignal) => Promise<ScreenSignature | null>,
  signal: AbortSignal,
  timeoutMs = 15_000,
): Promise<void> {
  let matched = false;
  const readState = {
    validReads: 0,
    hierarchyError: null as UiHierarchyUnavailableError | null,
  };
  try {
    await pollUntil(
      async (pollSignal) => {
        let current: ScreenSignature | null;
        try {
          current = await read(pollSignal);
        } catch (error) {
          if (
            !(error instanceof UiHierarchyUnavailableError) ||
            pollSignal.aborted
          )
            throw error;
          readState.hierarchyError = error;
          matched = false;
          return undefined;
        }
        if (current) readState.validReads++;
        if (current && sameScreen(expected, current)) {
          if (matched) return true;
          matched = true;
        } else matched = false;
        return undefined;
      },
      signal,
      timeoutMs,
      'Timeout: a tela esperada não foi reconhecida.',
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
