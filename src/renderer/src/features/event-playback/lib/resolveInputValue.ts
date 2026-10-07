import type { useDatasetStore } from '../../../entities/dataset/index.ts';

type DatasetState = ReturnType<typeof useDatasetStore.getState>;

/** Resolve o template sem expor o valor da massa em erros ou logs. */
export function resolveInputValue(
  template: string,
  dataset: DatasetState,
): string {
  const variables = [...template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)];
  const row = dataset.rows[dataset.activeRowIndex] ?? {};
  for (const [, key] of variables) {
    if (!dataset.columns.includes(key))
      throw new Error(
        `Variável {{${key}}} não existe no dataset "${dataset.currentName}".`,
      );
    if (!row[key]?.trim())
      throw new Error(
        `Variável {{${key}}} sem valor na massa ativa #${dataset.activeRowIndex + 1} de "${dataset.currentName}". Preencha em Dados › Datasets.`,
      );
  }
  const resolved = dataset.resolve(template);
  if (!resolved.trim() || /\{\{/.test(resolved))
    throw new Error(
      'Texto vazio ou variável inválida. Confira o dataset e o valor do step.',
    );
  return resolved;
}
