import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Linha dinâmica do dataset (coluna → valor). */
export type DynamicDatasetRow = Record<string, string>;

/** Snapshot completo de um dataset nomeado (biblioteca). */
export type SavedDataset = {
  name: string;
  columns: string[];
  rows: DynamicDatasetRow[];
  activeRowIndex: number;
};

type DatasetStore = {
  /** Nome do dataset atualmente carregado. */
  currentName: string;
  /** Biblioteca — todos os datasets salvos. Chave = nome. */
  library: Record<string, SavedDataset>;

  // Estado do dataset carregado (top-level pra manter API existente).
  columns: string[];
  rows: DynamicDatasetRow[];
  activeRowIndex: number;

  addColumn: (name: string) => void;
  removeColumn: (name: string) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  setCell: (rowIndex: number, column: string, value: string) => void;
  setActiveRow: (index: number) => void;

  /** Lista os nomes de todos os datasets salvos (inclui o atual). */
  listDatasets: () => string[];
  /** Cria novo dataset com colunas default e o carrega. */
  createDataset: (name: string) => void;
  /** Salva o atual na biblioteca e carrega o dataset alvo. */
  switchDataset: (name: string) => void;
  /** Renomeia o dataset atual. */
  renameCurrentDataset: (newName: string) => void;
  /** Apaga um dataset da biblioteca. Se for o atual, carrega outro. */
  removeDataset: (name: string) => void;

  /**
   * Substitui `{{coluna}}` no template pelo valor da linha ativa. Colunas
   * ausentes viram string vazia (com warning no console).
   */
  resolve: (template: string) => string;
};

const DEFAULT_COLUMNS = ['nome', 'agencia', 'conta', 'cpf'] as const;
const DEFAULT_DATASET_NAME = 'Padrão';

function emptyRow(): DynamicDatasetRow {
  return Object.fromEntries(DEFAULT_COLUMNS.map((c) => [c, '']));
}

function emptyDataset(name: string): SavedDataset {
  return {
    name,
    columns: [...DEFAULT_COLUMNS],
    rows: [emptyRow()],
    activeRowIndex: 0,
  };
}

export const useDatasetStore = create<DatasetStore>()(
  persist(
    (set, get) => {
      /** Snapshot o estado top-level dentro de `library[currentName]`. */
      const snapshotToLibrary = () => {
        const s = get();
        set({
          library: {
            ...s.library,
            [s.currentName]: {
              name: s.currentName,
              columns: s.columns,
              rows: s.rows,
              activeRowIndex: s.activeRowIndex,
            },
          },
        });
      };

      const initialDs = emptyDataset(DEFAULT_DATASET_NAME);
      return {
        currentName: DEFAULT_DATASET_NAME,
        library: { [DEFAULT_DATASET_NAME]: initialDs },
        columns: initialDs.columns,
        rows: initialDs.rows,
        activeRowIndex: initialDs.activeRowIndex,

        addColumn: (name) => {
          set((s) => {
            const clean = name.trim();
            if (!clean || s.columns.includes(clean)) return s;
            return {
              columns: [...s.columns, clean],
              rows: s.rows.map((r) => ({ ...r, [clean]: r[clean] ?? '' })),
            };
          });
          snapshotToLibrary();
        },

        removeColumn: (name) => {
          set((s) => ({
            columns: s.columns.filter((c) => c !== name),
            rows: s.rows.map((r) => {
              const copy = { ...r };
              delete copy[name];
              return copy;
            }),
          }));
          snapshotToLibrary();
        },

        addRow: () => {
          set((s) => ({
            rows: [
              ...s.rows,
              Object.fromEntries(s.columns.map((c) => [c, ''])),
            ],
          }));
          snapshotToLibrary();
        },

        removeRow: (index) => {
          set((s) => {
            if (s.rows.length <= 1) return s;
            const rows = s.rows.filter((_, i) => i !== index);
            const activeRowIndex = Math.min(s.activeRowIndex, rows.length - 1);
            return { rows, activeRowIndex };
          });
          snapshotToLibrary();
        },

        setCell: (rowIndex, column, value) => {
          set((s) => {
            const rows = s.rows.slice();
            rows[rowIndex] = { ...rows[rowIndex], [column]: value };
            return { rows };
          });
          snapshotToLibrary();
        },

        setActiveRow: (index) => {
          set({ activeRowIndex: index });
          snapshotToLibrary();
        },

        listDatasets: () => Object.keys(get().library),

        createDataset: (name) => {
          const clean = name.trim();
          if (!clean) return;
          snapshotToLibrary();
          const ds = emptyDataset(clean);
          set({
            library: { ...get().library, [clean]: ds },
            currentName: clean,
            columns: ds.columns,
            rows: ds.rows,
            activeRowIndex: ds.activeRowIndex,
          });
        },

        switchDataset: (name) => {
          const state = get();
          if (name === state.currentName) return;
          snapshotToLibrary();
          const target = get().library[name];
          if (!target) return;
          set({
            currentName: target.name,
            columns: target.columns,
            rows: target.rows,
            activeRowIndex: target.activeRowIndex,
          });
        },

        renameCurrentDataset: (newName) => {
          const clean = newName.trim();
          if (!clean) return;
          set((s) => {
            if (clean === s.currentName) return s;
            if (s.library[clean]) return s; // conflito
            const lib = { ...s.library };
            delete lib[s.currentName];
            lib[clean] = {
              name: clean,
              columns: s.columns,
              rows: s.rows,
              activeRowIndex: s.activeRowIndex,
            };
            return { library: lib, currentName: clean };
          });
        },

        removeDataset: (name) => {
          set((s) => {
            const lib = { ...s.library };
            delete lib[name];
            return { library: lib };
          });
          if (get().currentName === name) {
            const remaining = Object.keys(get().library);
            if (remaining.length > 0) {
              const first = get().library[remaining[0]];
              set({
                currentName: first.name,
                columns: first.columns,
                rows: first.rows,
                activeRowIndex: first.activeRowIndex,
              });
            } else {
              // Sem nenhum — recria o default
              const ds = emptyDataset(DEFAULT_DATASET_NAME);
              set({
                library: { [DEFAULT_DATASET_NAME]: ds },
                currentName: DEFAULT_DATASET_NAME,
                columns: ds.columns,
                rows: ds.rows,
                activeRowIndex: ds.activeRowIndex,
              });
            }
          }
        },

        resolve: (template) => {
          const { rows, columns, activeRowIndex, currentName } = get();
          const row = rows[activeRowIndex] ?? {};
          return template.replace(
            /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
            (_, key: string) => {
              const val = row[key];
              if (val === undefined) {
                console.warn(
                  `[Dataset "${currentName}"] Variável {{${key}}} não existe. Colunas disponíveis: [${columns.join(', ')}]. Massa ativa #${activeRowIndex + 1}.`,
                );
                return '';
              }
              if (val === '') {
                console.warn(
                  `[Dataset "${currentName}"] Variável {{${key}}} está vazia na massa ativa #${activeRowIndex + 1}.`,
                );
              }
              return val;
            },
          );
        },
      };
    },
    {
      name: 'flowtest.dataset.v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentName: s.currentName,
        library: s.library,
        columns: s.columns,
        rows: s.rows,
        activeRowIndex: s.activeRowIndex,
      }),
    },
  ),
);
