import { create } from 'zustand';

export type RecorderPhase = 'gravar' | 'editar' | 'salvar';

type RecorderStore = {
  recorderPhase: RecorderPhase;
  recorderTitle: string;
  recording: boolean;
  recordingSeconds: number;
  selectedStepId: number | null;

  setRecorderPhase: (p: RecorderPhase) => void;
  setSelectedStep: (id: number | null) => void;
};

export const useRecorderStore = create<RecorderStore>((set) => ({
  recorderPhase: 'gravar',
  recorderTitle: 'Login básico',
  recording: true,
  recordingSeconds: 64,
  selectedStepId: 2,

  setRecorderPhase: (p) => set({ recorderPhase: p }),
  setSelectedStep: (id) => set({ selectedStepId: id }),
}));
