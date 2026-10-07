import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { stepDisplayLabel, type Step } from '@/entities/step';

/** Uma Action salva — sequência de steps reutilizável no Flow. */
export type SavedAction = {
  id: string;
  name: string;
  folder: string;
  createdAt: string;
  steps: Step[];
  /** Colunas do dataset usadas como variáveis (`{{col}}`) nos steps. */
  paramColumns: string[];
};

type ActionStore = {
  actions: SavedAction[];
  addAction: (a: Omit<SavedAction, 'id' | 'createdAt'>) => SavedAction;
  removeAction: (id: string) => void;
};

function extractParamColumns(steps: Step[]): string[] {
  const cols = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  for (const s of steps) {
    if (!s.value) continue;
    for (const m of s.value.matchAll(re)) cols.add(m[1]);
  }
  return [...cols];
}

export const useActionStore = create<ActionStore>()(
  persist(
    (set, get) => ({
      actions: [],
      addAction: (a) => {
        const steps = structuredClone(a.steps).map((step) => ({
          ...step,
          label: stepDisplayLabel(step),
          selected: false,
          pending: false,
          selectors: step.selectors.filter(
            (selector) => selector.type !== 'coordinates',
          ),
        }));
        const action: SavedAction = {
          ...a,
          steps,
          id: `action_${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
          paramColumns: extractParamColumns(steps),
        };
        // Persistir primeiro permite reportar quota/indisponibilidade sem
        // mostrar como salvo um bloco que sumiria ao recarregar.
        const actions = [...get().actions, action];
        localStorage.setItem(
          'flowtest.actions.v1',
          JSON.stringify({ state: { actions }, version: 0 }),
        );
        set({ actions });
        return action;
      },
      removeAction: (id) =>
        set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),
    }),
    {
      name: 'flowtest.actions.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ actions: s.actions }),
    },
  ),
);
