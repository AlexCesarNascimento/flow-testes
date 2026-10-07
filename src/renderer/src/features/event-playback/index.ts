import { waitForTarget } from './lib/waitForTarget';
import { waitForFocusedInput } from './lib/waitForFocusedInput';
import { resolveInputValue } from './lib/resolveInputValue';
import { getAdbPort } from '@/shared/lib/adb-runner';
import {
  adbCommand,
  readUiDump,
  UiHierarchyUnavailableError,
} from '@/shared/lib/adb-ui';
import { parseUiDump } from '@/shared/lib/ui-hierarchy';
import {
  isScreenSignature,
  screenSignature,
} from '@/shared/lib/screen-signature';
import type { Step } from '@/entities/step';
import { useDatasetStore } from '@/entities/dataset';
import { useRecorderStore } from '@/entities/recorder';
import {
  executeSteps,
  type StepProgress,
  type StepResult,
  type RunResult,
  type WaitForNext,
} from './lib/runner';
import { waitForScreen } from './lib/waitForScreen';
import { waitDelay } from './lib/runner';
import { withStepTimeout } from './lib/withStepTimeout';
import { pollUntil } from './lib/pollUntil';
import {
  findSecureKeypadButton,
  isSecureKeypadVariable,
  validateSecureKeypadPassword,
} from './lib/secureKeypad';

export type { StepProgress, StepResult, RunResult } from './lib/runner';
let activeRun: AbortController | null = null;

async function executeStep(
  step: Step,
  signal: AbortSignal,
  report?: (message: string) => void,
): Promise<StepResult> {
  signal.throwIfAborted();
  const adb = getAdbPort()?.getAdb();
  if (!adb) throw new Error('Device não conectado.');
  const command = (args: string[]) =>
    adbCommand(adb, args, signal, step.timeoutMs ?? 10_000);
  const timeoutMs = step.timeoutMs ?? 15_000;
  const passed = (message: string): StepResult => ({
    status: 'passed',
    message,
  });

  if (step.type === 'waitForPage') {
    report?.(`Aguardando reconhecimento da tela (até ${timeoutMs / 1000} s).`);
    if (step.screenSignature !== undefined) {
      if (!isScreenSignature(step.screenSignature))
        throw new Error('Assinatura de tela inválida.');
      await waitForScreen(
        step.screenSignature,
        async (waitSignal) =>
          screenSignature(parseUiDump(await readUiDump(adb, waitSignal))),
        signal,
        timeoutMs,
      );
      return passed('Tela reconhecida pela assinatura.');
    }
    const pkg = step.value?.trim();
    if (!pkg)
      throw new Error(
        'Reconhecimento legado sem pacote. Grave novamente este step.',
      );
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const output = await command(['dumpsys', 'window', 'windows']);
      const focus = output.match(
        /mCurrentFocus=[^\n]*\s([a-zA-Z0-9_.]+)\//,
      )?.[1];
      if (focus === pkg)
        return passed(
          'Pacote reconhecido (step legado sem assinatura de tela).',
        );
      await new Promise((resolve) => setTimeout(resolve, 200));
      signal.throwIfAborted();
    }
    throw new Error('Timeout esperando o pacote do step legado.');
  }

  if (step.type === 'launchApp') {
    const pkg = (step.value ?? step.label).trim();
    if (!/^[a-zA-Z][\w]*(?:\.[\w]+)+$/.test(pkg))
      throw new Error('Package name inválido.');
    report?.(
      `Abrindo ${pkg}; aguardando resposta do device (até ${(step.timeoutMs ?? 10_000) / 1000} s).`,
    );
    const output = await command([
      'monkey',
      '-p',
      pkg,
      '-c',
      'android.intent.category.LAUNCHER',
      '1',
    ]);
    if (!output.includes('Events injected: 1'))
      throw new Error('O device não confirmou a abertura do app.');
    return passed(`App ${pkg} iniciado.`);
  }

  if (step.type === 'secureKeypad') {
    if (!isSecureKeypadVariable(step.value))
      throw new Error('Configure uma variável {{coluna}} para a senha.');
    const password = validateSecureKeypadPassword(
      resolveInputValue(step.value, useDatasetStore.getState()),
    );
    const marker = step.selectors.find(
      (selector) => selector.type === 'resourceId',
    )?.value;
    const expectedPackage = marker?.split(':id/')[0];
    for (let index = 0; index < password.length; index++) {
      signal.throwIfAborted();
      report?.(
        `Lendo teclado seguro — posição ${index + 1}/${password.length}.`,
      );
      const target = await pollUntil(
        async (pollSignal) => {
          try {
            const elements = parseUiDump(await readUiDump(adb, pollSignal));
            return (
              findSecureKeypadButton(
                elements,
                password[index],
                expectedPackage,
              ) ?? undefined
            );
          } catch (error) {
            if (
              error instanceof UiHierarchyUnavailableError &&
              !pollSignal.aborted
            )
              return undefined;
            throw error;
          }
        },
        signal,
        10_000,
        'Teclado numérico não apareceu completo e habilitado.',
        250,
      );
      const [left, top, right, bottom] = target.bounds;
      report?.(`Enviando posição ${index + 1}/${password.length} ao device…`);
      await command([
        'input',
        'tap',
        String(Math.round((left + right) / 2)),
        String(Math.round((top + bottom) / 2)),
      ]);
    }
    return passed('Senha enviada pelo teclado numérico dinâmico.');
  }

  const locate = async (): Promise<[number, number]> => {
    const element = await waitForTarget(
      step.selectors,
      async (pollSignal) => parseUiDump(await readUiDump(adb, pollSignal)),
      signal,
      report,
      timeoutMs,
    );
    const [l, t, r, b] = element.bounds;
    return [Math.round((l + r) / 2), Math.round((t + b) / 2)];
  };

  if (step.type === 'tap' || step.type === 'longPress') {
    const [x, y] = (await locate()).map(String);
    report?.('Enviando interação ao device…');
    await command(
      step.type === 'tap'
        ? ['input', 'tap', x, y]
        : ['input', 'swipe', x, y, x, y, '600'],
    );
    return passed('Interação enviada ao device.');
  }
  if (step.type === 'inputText') {
    const resolved = resolveInputValue(
      step.value ?? '',
      useDatasetStore.getState(),
    );
    if (step.selectors.length) {
      const [x, y] = (await locate()).map(String);
      await command(['input', 'tap', x, y]);
    } else {
      await waitForFocusedInput(
        async (pollSignal) => parseUiDump(await readUiDump(adb, pollSignal)),
        signal,
        report,
        step.timeoutMs ?? 5_000,
      );
    }
    await command(['input', 'text', resolved.replace(/ /g, '%s')]);
    return passed('Texto enviado ao device.');
  }
  throw new Error(`Tipo "${step.type}" ainda não implementado no playback.`);
}

/** Compatibilidade com o inspector; compartilha exclusão com a execução em lote. */
export async function playStep(step: Step): Promise<string> {
  const result = await runSteps([step]);
  return result.message;
}

export function stopRun(): void {
  activeRun?.abort();
}

/** Usa o delay como limite; uma leitura pronta antecipa o próximo step. */
const waitForNextStep: WaitForNext = async (next, maxMs, signal) => {
  const semantic = next.selectors.some((selector) =>
    ['resourceId', 'accessibilityId', 'text'].includes(selector.type),
  );
  const observable =
    (next.type === 'waitForPage' && isScreenSignature(next.screenSignature)) ||
    (['tap', 'longPress', 'inputText'].includes(next.type) && semantic) ||
    (next.type === 'inputText' && next.selectors.length === 0) ||
    next.type === 'secureKeypad';
  if (!observable) return 'unsupported';

  const startedAt = performance.now();
  const adb = getAdbPort()?.getAdb();
  if (!adb) {
    await waitDelay(maxMs, signal);
    return 'elapsed';
  }
  try {
    if (
      next.type === 'waitForPage' &&
      isScreenSignature(next.screenSignature)
    ) {
      await waitForScreen(
        next.screenSignature,
        async (pollSignal) =>
          screenSignature(parseUiDump(await readUiDump(adb, pollSignal))),
        signal,
        maxMs,
      );
    } else if (next.type === 'secureKeypad') {
      const marker = next.selectors.find(
        (selector) => selector.type === 'resourceId',
      )?.value;
      await pollUntil(
        async (pollSignal) => {
          const elements = parseUiDump(await readUiDump(adb, pollSignal));
          return (
            findSecureKeypadButton(elements, '0', marker?.split(':id/')[0]) ??
            undefined
          );
        },
        signal,
        maxMs,
        'Teclado numérico não apareceu durante o delay.',
      );
    } else if (next.type === 'inputText' && next.selectors.length === 0) {
      await waitForFocusedInput(
        async (pollSignal) => parseUiDump(await readUiDump(adb, pollSignal)),
        signal,
        undefined,
        maxMs,
      );
    } else {
      await waitForTarget(
        next.selectors,
        async (pollSignal) => parseUiDump(await readUiDump(adb, pollSignal)),
        signal,
        undefined,
        maxMs,
      );
    }
    return 'ready';
  } catch (error) {
    if (signal.aborted) throw error;
    await waitDelay(
      Math.max(0, maxMs - (performance.now() - startedAt)),
      signal,
    );
    return 'elapsed';
  }
};

export async function runSteps(
  steps: Step[],
  onProgress?: (index: number, step: Step, progress: StepProgress) => void,
): Promise<RunResult> {
  if (activeRun)
    return {
      status: 'failed',
      completed: 0,
      message: 'Já existe uma execução em andamento.',
    };
  const controller = new AbortController();
  activeRun = controller;
  useRecorderStore.setState({ playbackRunning: true });
  try {
    return await executeSteps(
      steps,
      (step, signal, report) =>
        withStepTimeout(
          (actionSignal) => executeStep(step, actionSignal, report),
          signal,
          step.timeoutMs ?? (step.type === 'secureKeypad' ? 60_000 : undefined),
        ),
      controller.signal,
      onProgress,
      waitForNextStep,
    );
  } finally {
    if (activeRun === controller) {
      activeRun = null;
      useRecorderStore.setState({ playbackRunning: false });
    }
  }
}
