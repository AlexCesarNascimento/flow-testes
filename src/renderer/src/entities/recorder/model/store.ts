import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Step } from '@/entities/step';
import type { DeviceSnapshot } from '@/shared/lib/device-snapshot';

export type RecorderPhase = 'gravar' | 'editar' | 'salvar';

/** Ponto capturado usado para feedback visual (ripple no DeviceFrame). */
export type CapturedPoint = {
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  seq: number; // muda a cada evento para forçar re-animação
};

type RecorderStore = {
  recorderPhase: RecorderPhase;
  recorderTitle: string;
  recording: boolean;
  playbackRunning: boolean;
  captureStatus: 'idle' | 'preparing' | 'ready' | 'error';
  setCaptureStatus: (status: 'idle' | 'preparing' | 'ready' | 'error') => void;
  recordingSeconds: number;
  selectedStepId: number | null;
  steps: Step[];
  screenshots: Record<number, DeviceSnapshot>;
  setScreenshot: (id: number, snapshot: DeviceSnapshot) => void;
  lastCapturedPoint: CapturedPoint | null;

  setRecorderPhase: (p: RecorderPhase) => void;
  setSelectedStep: (id: number | null) => void;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecorder: () => void;
  tickRecording: () => void;
  appendStep: (step: Step) => void;
  insertStepBefore: (refId: number, step: Step) => void;
  updateStep: (id: number, patch: Partial<Step>) => void;
  removeStep: (id: number) => void;
  moveStep: (fromIndex: number, toIndex: number) => void;
  toggleStepSelected: (id: number) => void;
  clearSteps: () => void;
  pushCapturedPoint: (
    x: number,
    y: number,
    displayWidth: number,
    displayHeight: number,
  ) => void;

  /** Visibilidade do side sheet (Inspector). */
  inspectorOpen: boolean;
  toggleInspector: () => void;
};

export const useRecorderStore = create<RecorderStore>()(
  persist(
    (set) => ({
      recorderPhase: 'gravar',
      recorderTitle: 'Login básico',
      recording: false,
      playbackRunning: false,
      captureStatus: 'idle',
      setCaptureStatus: (captureStatus) => set({ captureStatus }),
      recordingSeconds: 0,
      selectedStepId: null,
      steps: [],
      screenshots: {},
      setScreenshot: (id, snapshot) =>
        set((s) => {
          if (!s.steps.some((step) => step.id === id)) return s;
          const entries = Object.entries({ ...s.screenshots, [id]: snapshot })
            .sort((a, b) => a[1].capturedAt - b[1].capturedAt)
            .slice(-40);
          return { screenshots: Object.fromEntries(entries) };
        }),
      lastCapturedPoint: null,

      setRecorderPhase: (p) => set({ recorderPhase: p }),
      setSelectedStep: (id) => set({ selectedStepId: id }),
      startRecording: () => set({ recording: true }),
      stopRecording: () => set({ recording: false }),
      tickRecording: () =>
        set((s) => ({
          recordingSeconds: s.recording
            ? s.recordingSeconds + 1
            : s.recordingSeconds,
        })),
      appendStep: (step) => set((s) => ({ steps: [...s.steps, step] })),
      insertStepBefore: (refId, step) =>
        set((s) => {
          const idx = s.steps.findIndex((st) => st.id === refId);
          if (idx < 0) return { steps: [...s.steps, step] };
          return {
            steps: [...s.steps.slice(0, idx), step, ...s.steps.slice(idx)],
          };
        }),
      updateStep: (id, patch) =>
        set((s) => ({
          steps: s.steps.map((st) => (st.id === id ? { ...st, ...patch } : st)),
        })),
      removeStep: (id) =>
        set((s) => ({
          steps: s.steps.filter((st) => st.id !== id),
          screenshots: Object.fromEntries(
            Object.entries(s.screenshots).filter(([key]) => Number(key) !== id),
          ),
          selectedStepId: s.selectedStepId === id ? null : s.selectedStepId,
        })),
      moveStep: (from, to) =>
        set((s) => {
          if (
            from === to ||
            from < 0 ||
            to < 0 ||
            from >= s.steps.length ||
            to >= s.steps.length
          ) {
            return s;
          }
          const steps = s.steps.slice();
          const [moved] = steps.splice(from, 1);
          steps.splice(to, 0, moved);
          return { steps };
        }),
      toggleStepSelected: (id) =>
        set((s) => ({
          steps: s.steps.map((st) =>
            st.id === id ? { ...st, selected: !st.selected } : st,
          ),
        })),
      clearSteps: () =>
        set({ steps: [], screenshots: {}, selectedStepId: null }),
      pushCapturedPoint: (x, y, displayWidth, displayHeight) =>
        set((s) => ({
          lastCapturedPoint: {
            x,
            y,
            displayWidth,
            displayHeight,
            seq: (s.lastCapturedPoint?.seq ?? 0) + 1,
          },
        })),
      resetRecorder: () =>
        set({
          recorderPhase: 'gravar',
          recording: false,
          recordingSeconds: 0,
          selectedStepId: null,
          steps: [],
          screenshots: {},
          lastCapturedPoint: null,
        }),

      inspectorOpen: true,
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
    }),
    {
      name: 'flowtest.recorder.v1',
      storage: createJSONStorage(() => localStorage),
      // Persiste só o conteúdo do fluxo. Estado runtime (recording,
      // recordingSeconds, lastCapturedPoint) é sempre resetado no reload.
      partialize: (s) => ({
        recorderTitle: s.recorderTitle,
        steps: s.steps,
      }),
    },
  ),
);
