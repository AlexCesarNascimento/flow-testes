import type { Step } from '../../../entities/step/index.ts';

export type StepResult = {
  status: 'passed' | 'failed' | 'cancelled';
  message: string;
};
export type StepProgress =
  { status: 'running' | 'waiting'; message: string } | StepResult;
export type RunResult = StepResult & { completed: number };
export type StepExecutor = (
  step: Step,
  signal: AbortSignal,
  report?: (message: string) => void,
) => Promise<StepResult>;
export type WaitForNext = (
  step: Step,
  maxMs: number,
  signal: AbortSignal,
) => Promise<'ready' | 'elapsed' | 'unsupported'>;

/** Sequência independente do transporte; o início precede qualquer await no device. */
export async function executeSteps(
  steps: Step[],
  execute: StepExecutor,
  signal: AbortSignal,
  onProgress?: (index: number, step: Step, progress: StepProgress) => void,
  waitForNext?: WaitForNext,
): Promise<RunResult> {
  let completed = 0;
  for (let index = 0; index < steps.length; index++) {
    if (signal.aborted)
      return { status: 'cancelled', completed, message: 'Execução cancelada.' };
    const step = steps[index];
    onProgress?.(index, step, { status: 'running', message: 'Executando…' });
    let result: StepResult;
    try {
      result = await execute(step, signal, (message) =>
        onProgress?.(index, step, { status: 'running', message }),
      );
    } catch (error) {
      result = {
        status: signal.aborted ? 'cancelled' : 'failed',
        message: signal.aborted
          ? 'Execução cancelada.'
          : `Falha: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    if (signal.aborted)
      result = { status: 'cancelled', message: 'Execução cancelada.' };
    onProgress?.(index, step, result);
    if (result.status !== 'passed') return { ...result, completed };
    completed++;
    if (index < steps.length - 1 && (step.delayAfterMs ?? 0) > 0) {
      const ms = step.delayAfterMs!;
      if (!Number.isFinite(ms) || ms > 300_000)
        return {
          status: 'failed',
          completed,
          message: 'Delay inválido (máximo de 300 s).',
        };
      onProgress?.(index, step, {
        status: 'waiting',
        message: `Aguardando até ${ms / 1000} s para o próximo passo…`,
      });
      try {
        const readiness = waitForNext
          ? await waitForNext(steps[index + 1], ms, signal)
          : 'unsupported';
        if (readiness === 'unsupported') await waitDelay(ms, signal);
        signal.throwIfAborted();
      } catch {
        const cancelled = {
          status: 'cancelled' as const,
          message: 'Execução cancelada durante o delay.',
        };
        onProgress?.(index, step, cancelled);
        return { ...cancelled, completed };
      }
      onProgress?.(index, step, result);
    }
  }
  return {
    status: 'passed',
    completed,
    message: `Concluído — ${completed} step${completed === 1 ? '' : 's'}.`,
  };
}

export function waitDelay(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Execução cancelada.', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}
