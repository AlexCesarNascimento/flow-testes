import { create } from 'zustand';

export type Ambiente = {
  name: string;
  packageId: string;
  apiUrl: string;
  description: string;
  active: boolean;
};

export type Secret = { name: string };

type AmbienteStore = {
  ambiente: string;
  device: string;
  ambientes: Ambiente[];
  secrets: Secret[];

  setAmbiente: (a: string) => void;
};

export const useAmbienteStore = create<AmbienteStore>((set) => ({
  ambiente: 'HOMOLOG',
  device: 'Pixel 7 · Android 14',

  ambientes: [
    {
      name: 'DEV',
      packageId: 'com.exemplo.app.dev',
      apiUrl: 'https://api.dev.exemplo.app',
      description: 'Dados de teste livres. Todos os secrets disponíveis.',
      active: false,
    },
    {
      name: 'HOMOLOG',
      packageId: 'com.exemplo.app.hml',
      apiUrl: 'https://api.hml.exemplo.app',
      description: 'Espelho de produção. Dados mascarados.',
      active: true,
    },
    {
      name: 'PROD',
      packageId: 'com.exemplo.app',
      apiUrl: 'https://api.exemplo.app',
      description:
        'Somente leitura: datasets e secrets não podem ser alterados.',
      active: false,
    },
  ],

  secrets: [{ name: 'login_password' }, { name: 'api_token' }],

  setAmbiente: (a) => set({ ambiente: a }),
}));
