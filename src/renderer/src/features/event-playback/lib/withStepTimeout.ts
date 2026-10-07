/** Limita toda a ação, incluindo leituras e comando, sem consumir o delay posterior. */
export async function withStepTimeout<T>(
  action: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  timeoutMs?: number,
): Promise<T> {
  signal.throwIfAborted();
  if (timeoutMs === undefined) return action(signal);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120_000)
    throw new Error('Timeout inválido: use de 1 a 120 segundos.');
  const deadline = new AbortController();
  const combined = AbortSignal.any([signal, deadline.signal]);
  let onAbort!: () => void;
  const interrupted = new Promise<never>((_, reject) => {
    onAbort = () =>
      reject(
        signal.aborted
          ? new DOMException('Execução cancelada.', 'AbortError')
          : new Error(`Timeout: o step excedeu ${timeoutMs / 1000} s.`),
      );
    combined.addEventListener('abort', onAbort, { once: true });
  });
  const timer = setTimeout(() => deadline.abort(), timeoutMs);
  try {
    return await Promise.race([action(combined), interrupted]);
  } finally {
    clearTimeout(timer);
    combined.removeEventListener('abort', onAbort);
  }
}
