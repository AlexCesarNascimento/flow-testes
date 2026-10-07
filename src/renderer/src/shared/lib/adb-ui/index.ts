import type { Adb } from '@yume-chan/adb';

export function abortError(): Error {
  return new DOMException('Execução cancelada.', 'AbortError');
}

/** Cada comando tem prazo; timeout/cancelamento encerra o processo remoto. */
export async function adbCommand(
  adb: Adb,
  args: string[],
  signal?: AbortSignal,
  timeoutMs = 10_000,
): Promise<string> {
  signal?.throwIfAborted();
  let process:
    Awaited<ReturnType<Adb['subprocess']['noneProtocol']['spawn']>> | undefined;
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel: (() => void) | undefined;
  const interrupted = new Promise<never>((_, reject) => {
    cancel = () => {
      expired = true;
      reject(abortError());
    };
    signal?.addEventListener('abort', cancel, { once: true });
    timer = setTimeout(() => {
      expired = true;
      reject(new Error('Tempo limite do comando no device.'));
    }, timeoutMs);
  });
  const execute = async () => {
    process = await adb.subprocess.noneProtocol.spawn(args);
    if (expired) {
      await process.kill();
      throw abortError();
    }
    const reader = process.output.getReader();
    const decoder = new TextDecoder();
    let text = '';
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) return text + decoder.decode();
        text += decoder.decode(result.value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  };
  try {
    const output = await Promise.race([execute(), interrupted]);
    if (
      !output.includes('<hierarchy') &&
      /\b(?:error|exception|permission denied|not found)\b/i.test(output)
    ) {
      throw new Error('O device recusou o comando.');
    }
    return output;
  } finally {
    clearTimeout(timer);
    if (cancel) signal?.removeEventListener('abort', cancel);
    if (expired && process)
      void Promise.resolve(process.kill()).catch(() => undefined);
  }
}

let sequence = 0;
const dumpQueue = new WeakMap<Adb, Promise<void>>();

export class UiHierarchyUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UiHierarchyUnavailableError';
  }
}

/** Uma sessão uiautomator por device, inclusive entre captura e playback. */
async function serializedDump<T>(
  adb: Adb,
  signal: AbortSignal | undefined,
  task: () => Promise<T>,
): Promise<T> {
  signal?.throwIfAborted();
  const previous = dumpQueue.get(adb) ?? Promise.resolve();
  let release!: () => void;
  const turn = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => turn);
  dumpQueue.set(adb, queued);
  let cancel: (() => void) | undefined;
  const interrupted = new Promise<never>((_, reject) => {
    cancel = () => reject(abortError());
    signal?.addEventListener('abort', cancel, { once: true });
  });
  try {
    await Promise.race([previous, interrupted]);
    signal?.throwIfAborted();
    return await task();
  } finally {
    if (cancel) signal?.removeEventListener('abort', cancel);
    release();
    if (dumpQueue.get(adb) === queued) dumpQueue.delete(adb);
  }
}

async function dumpOnce(
  adb: Adb,
  signal: AbortSignal | undefined,
  verbose: boolean,
): Promise<string> {
  // Um caminho por tentativa impede que o fallback leia XML antigo.
  const path = `/data/local/tmp/flowtest-ui-${Date.now()}-${sequence++}.xml`;
  try {
    await adbCommand(
      adb,
      ['uiautomator', 'dump', ...(verbose ? ['--verbose'] : []), path],
      signal,
      12_000,
    );
    const xml = await adbCommand(adb, ['cat', path], signal, 2000);
    if (!/<hierarchy\b/.test(xml) || !/<node\b/.test(xml))
      throw new UiHierarchyUnavailableError(
        'O dump Android retornou uma hierarquia vazia ou sem elementos.',
      );
    return xml;
  } finally {
    void adbCommand(adb, ['rm', '-f', path], undefined, 2000).catch(
      () => undefined,
    );
  }
}

export async function readUiDump(
  adb: Adb,
  signal?: AbortSignal,
): Promise<string> {
  return serializedDump(adb, signal, async () => {
    try {
      return await dumpOnce(adb, signal, false);
    } catch (error) {
      if (signal?.aborted) throw error;
      if (!(error instanceof UiHierarchyUnavailableError)) throw error;
      try {
        return await dumpOnce(adb, signal, true);
      } catch (fallbackError) {
        if (signal?.aborted) throw fallbackError;
        if (!(fallbackError instanceof UiHierarchyUnavailableError))
          throw fallbackError;
        throw new UiHierarchyUnavailableError(
          'A hierarquia Android veio vazia no dump normal e detalhado.',
          { cause: fallbackError },
        );
      }
    }
  });
}
