import { waitDelay } from './runner.ts';

export class PollTimeoutError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PollTimeoutError';
  }
}

/** Polling serial com deadline absoluto, inclusive se uma leitura não responder. */
export async function pollUntil<T>(
  check: (signal: AbortSignal) => Promise<T | undefined>,
  signal: AbortSignal,
  timeoutMs: number,
  timeoutMessage: string,
  intervalMs = 500,
): Promise<T> {
  signal.throwIfAborted();
  const deadline = new AbortController();
  const combined = AbortSignal.any([signal, deadline.signal]);
  const timer = setTimeout(() => deadline.abort(), timeoutMs);
  let stop: (() => void) | undefined;
  const interrupted = new Promise<never>((_, reject) => {
    stop = () => reject(new DOMException('Espera interrompida.', 'AbortError'));
    combined.addEventListener('abort', stop, { once: true });
  });
  const poll = async () => {
    while (true) {
      combined.throwIfAborted();
      const result = await check(combined);
      combined.throwIfAborted();
      if (result !== undefined) return result;
      await waitDelay(intervalMs, combined);
    }
  };
  try {
    return await Promise.race([poll(), interrupted]);
  } catch (error) {
    if (signal.aborted) signal.throwIfAborted();
    if (deadline.signal.aborted)
      throw new PollTimeoutError(timeoutMessage, { cause: error });
    throw error;
  } finally {
    clearTimeout(timer);
    if (stop) combined.removeEventListener('abort', stop);
  }
}
