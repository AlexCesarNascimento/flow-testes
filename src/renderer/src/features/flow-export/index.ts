import { stepDisplayLabel } from '../../entities/step/index.ts';
import {
  isScreenSignature,
  type ScreenSignature,
} from '../../shared/lib/screen-signature/index.ts';
import type { Step, Selector, StepType } from '../../entities/step/index.ts';

/**
 * SCHEMA DE EXPORTAÇÃO — FlowTest Recording v1
 *
 * ⚠️  ESTE SCHEMA É CONTRATO PÚBLICO. Regras de negócio dependem dele.
 *     Mudanças breaking devem incrementar `schemaVersion` (semver) e ser
 *     acompanhadas de migração explícita.
 *
 *   v1.0.0 — versão inicial.
 *   v1.2.0 — timeout opcional por step.
 *   v1.3.0 — step de teclado de senha dinâmico com referência de dataset.
 */
export const SCHEMA_VERSION = '1.3.0';
export const SCHEMA_URL =
  'https://flowtest.dev/schema/recording/v1.json' as const;

export type FlowSelectorType =
  | 'resourceId'
  | 'accessibilityId'
  | 'text'
  | 'xpath'
  | 'coordinates'
  | 'androidUi';

export type FlowStability = 'stable' | 'medium' | 'fragile';

export type FlowStepType = StepType;

export interface FlowSelectorExport {
  type: FlowSelectorType;
  value: string;
  stability: FlowStability;
  recommended?: boolean;
}

export interface FlowStepExport {
  timeoutMs?: number;
  screenSignature?: ScreenSignature;
  delayAfterMs?: number;
  /** Índice sequencial no fluxo (0-based). Estável dentro do export. */
  index: number;
  /** Tipo de ação. Consumidor deve tratar tipos desconhecidos como no-op. */
  type: FlowStepType;
  /** Rótulo humano. NÃO é seletor — apenas para display. */
  label: string;
  /** Instante relativo ao início da gravação (formato MM:SS). */
  time: string;
  /** Valor associado (texto digitado, package do app, etc.). null se n/a. */
  value: string | null;
  /**
   * Identidades semânticas do alvo. O playback combina os seletores
   * suportados no mesmo elemento; coordenadas não são exportadas.
   */
  selectors: FlowSelectorExport[];
}

export interface FlowDeviceInfoExport {
  /** Largura da tela do device em pixels. 0 se desconhecido. */
  displayWidth: number;
  /** Altura da tela do device em pixels. 0 se desconhecido. */
  displayHeight: number;
  /** Nome amigável do device (ex: "Pixel 7"). null se desconhecido. */
  name: string | null;
}

export interface FlowRecordingExport {
  /** URL do JSON Schema. Uso opcional pelo consumidor. */
  $schema: typeof SCHEMA_URL;
  /** Versão semver do schema. */
  schemaVersion: string;
  /** Discriminador — sempre "flowtest.recording" nesta v1. */
  kind: 'flowtest.recording';
  metadata: {
    /** Título humano da gravação. */
    title: string;
    /** ISO 8601 UTC do momento do export. */
    exportedAt: string;
    /** Duração total da gravação em segundos. */
    recordingDurationSeconds: number;
    /** Dados do device usado na gravação. */
    device: FlowDeviceInfoExport;
    /** Total de steps no export. */
    stepCount: number;
  };
  /** Lista ordenada de steps. */
  steps: FlowStepExport[];
}

export interface BuildExportInput {
  title: string;
  recordingSeconds: number;
  steps: Step[];
  device: FlowDeviceInfoExport;
}

/**
 * Constrói o objeto de export a partir do estado interno. Faz normalização:
 *  - `value` undefined vira `null` (JSON não distingue)
 *  - `recommended` só aparece se true (mantém JSON enxuto e compatível)
 *  - selectors preserva a ordem original
 */
export function buildRecordingExport(
  input: BuildExportInput,
): FlowRecordingExport {
  return {
    $schema: SCHEMA_URL,
    schemaVersion: SCHEMA_VERSION,
    kind: 'flowtest.recording',
    metadata: {
      title: input.title,
      exportedAt: new Date().toISOString(),
      recordingDurationSeconds: input.recordingSeconds,
      device: input.device,
      stepCount: input.steps.length,
    },
    steps: input.steps.map((step, index) => normalizeStep(step, index)),
  };
}

export function normalizeStep(step: Step, index: number): FlowStepExport {
  return {
    index,
    type: step.type,
    label: stepDisplayLabel(step),
    time: step.time,
    value: step.value ?? null,
    delayAfterMs: step.delayAfterMs ?? 0,
    ...(step.timeoutMs !== undefined ? { timeoutMs: step.timeoutMs } : {}),
    selectors: step.selectors
      .filter((s) => s.type !== 'coordinates')
      .map(normalizeSelector),
    ...(step.screenSignature
      ? {
          screenSignature: {
            ...step.screenSignature,
            anchors: step.screenSignature.anchors.map((anchor) => ({
              ...anchor,
            })),
          },
        }
      : {}),
  };
}

function normalizeSelector(sel: Selector): FlowSelectorExport {
  const out: FlowSelectorExport = {
    type: sel.type,
    value: sel.value,
    stability: sel.stability,
  };
  if (sel.recommended) out.recommended = true;
  return out;
}

/**
 * Dispara download do JSON no browser (renderer). Nome do arquivo é
 * derivado do título + timestamp.
 */
export function downloadRecordingJson(rec: FlowRecordingExport): void {
  const json = JSON.stringify(rec, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameFor(rec);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function filenameFor(rec: FlowRecordingExport): string {
  const slug =
    rec.metadata.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'recording';
  const stamp = rec.metadata.exportedAt.replace(/[:.]/g, '-').slice(0, 19);
  return `flowtest-${slug}-${stamp}.json`;
}

/**
 * Faz parse defensivo de um JSON exportado (schema v1.x). Retorna
 * `{ steps, title }` em caso de sucesso ou lança `Error` amigável em
 * caso de arquivo inválido.
 *
 * `startingId` renumera os IDs para não colidir com steps já existentes
 * quando o usuário faz "importar+anexar".
 */
export function parseRecordingImport(
  json: string,
  startingId = 1,
): { steps: Step[]; title: string } {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error('Arquivo não é JSON válido.');
  }
  if (!obj || typeof obj !== 'object') {
    throw new Error('JSON vazio ou inválido.');
  }
  const rec = obj as Partial<FlowRecordingExport>;
  if (rec.kind !== 'flowtest.recording') {
    throw new Error(
      `Tipo inesperado: ${rec.kind ?? '(sem kind)'}. Esperado "flowtest.recording".`,
    );
  }
  if (!rec.schemaVersion || !rec.schemaVersion.startsWith('1.')) {
    throw new Error(
      `Schema v${rec.schemaVersion ?? '?'} não suportado. Esperado v1.x.`,
    );
  }
  if (!Array.isArray(rec.steps)) {
    throw new Error('Campo "steps" ausente ou não é array.');
  }
  for (const step of rec.steps) {
    if (
      step.type === 'secureKeypad' &&
      (typeof step.value !== 'string' ||
        !/^\{\{[a-zA-Z0-9_]+\}\}$/.test(step.value))
    )
      throw new Error(
        'Step de senha requer uma variável {{coluna}}; senha literal não é aceita.',
      );
    if (
      step.timeoutMs !== undefined &&
      (typeof step.timeoutMs !== 'number' ||
        !Number.isFinite(step.timeoutMs) ||
        step.timeoutMs < 1000 ||
        step.timeoutMs > 120_000)
    )
      throw new Error('Timeout inválido no arquivo (1 a 120 segundos).');
    if (
      step.delayAfterMs !== undefined &&
      (typeof step.delayAfterMs !== 'number' ||
        !Number.isFinite(step.delayAfterMs) ||
        step.delayAfterMs < 0 ||
        step.delayAfterMs > 300_000)
    ) {
      throw new Error('Delay inválido no arquivo (0 a 300 segundos).');
    }
    if (
      step.screenSignature !== undefined &&
      !isScreenSignature(step.screenSignature)
    ) {
      throw new Error('Assinatura de tela inválida no arquivo.');
    }
  }
  const steps: Step[] = rec.steps.map((s, i) => ({
    id: startingId + i,
    type: s.type,
    label: s.label ?? `Step ${startingId + i}`,
    value: s.value ?? undefined,
    delayAfterMs: s.delayAfterMs ?? 0,
    ...(s.timeoutMs !== undefined ? { timeoutMs: s.timeoutMs } : {}),
    time: s.time ?? '--:--',
    selected: false,
    ...(s.screenSignature ? { screenSignature: s.screenSignature } : {}),
    selectors: (s.selectors ?? [])
      .filter((sel) => sel.type !== 'coordinates')
      .map((sel) => ({
        type: sel.type,
        value: sel.value,
        stability: sel.stability,
        ...(sel.recommended ? { recommended: true } : {}),
      })),
  }));
  return {
    steps: steps.map((step) => ({ ...step, label: stepDisplayLabel(step) })),
    title: rec.metadata?.title ?? 'Fluxo importado',
  };
}

/**
 * Abre file picker nativo e resolve com o texto do arquivo escolhido.
 * Retorna null se o usuário cancelou.
 */
export function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
