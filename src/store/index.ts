import { create } from 'zustand';

export type Selector = {
  type:
    | 'resourceId'
    | 'accessibilityId'
    | 'text'
    | 'xpath'
    | 'coordinates'
    | 'androidUi';
  value: string;
  stability: 'stable' | 'medium' | 'fragile';
  recommended?: boolean;
};

export type StepType =
  | 'launchApp'
  | 'tap'
  | 'inputText'
  | 'waitForElement'
  | 'assert'
  | 'wait'
  | 'swipe'
  | 'scroll'
  | 'keyEvent'
  | 'longPress';

export type Step = {
  id: number;
  type: StepType;
  label: string;
  value?: string;
  time: string;
  selected: boolean;
  selectors: Selector[];
};

export type DatasetRow = {
  id: string;
  active: boolean;
  login: string;
  senha: string;
  saudacao: string;
  tipo: string;
};

export type Ambiente = {
  name: string;
  packageId: string;
  apiUrl: string;
  description: string;
  active: boolean;
};

export type Secret = { name: string };

export type RecorderPhase = 'gravar' | 'editar' | 'salvar';

type Store = {
  project: string;
  ambiente: string;
  device: string;
  recorderPhase: RecorderPhase;
  recorderTitle: string;
  recording: boolean;
  recordingSeconds: number;
  steps: Step[];
  selectedStepId: number | null;
  datasetRows: DatasetRow[];
  ambientes: Ambiente[];
  secrets: Secret[];

  setRecorderPhase: (p: RecorderPhase) => void;
  setSelectedStep: (id: number | null) => void;
  setAmbiente: (a: string) => void;
};

const MOCK_STEPS: Step[] = [
  {
    id: 1,
    type: 'launchApp',
    label: 'com.exemplo.app.hml',
    time: '00:00',
    selected: false,
    selectors: [
      {
        type: 'resourceId',
        value: 'com.exemplo.app',
        stability: 'stable',
        recommended: true,
      },
      { type: 'text', value: 'App Exemplo', stability: 'medium' },
      { type: 'xpath', value: '/hierarchy', stability: 'fragile' },
    ],
  },
  {
    id: 2,
    type: 'tap',
    label: 'Elemento "Digite aqui"',
    time: '00:05',
    selected: true,
    selectors: [
      {
        type: 'accessibilityId',
        value: 'input-login',
        stability: 'stable',
        recommended: true,
      },
      {
        type: 'resourceId',
        value: 'com.exemplo:id/username',
        stability: 'medium',
      },
      { type: 'text', value: 'Digite aqui', stability: 'medium' },
      {
        type: 'xpath',
        value: '//android.widget.EditText[1]',
        stability: 'fragile',
      },
      {
        type: 'coordinates',
        value: '[540, 576] · 1080×2400',
        stability: 'fragile',
      },
    ],
  },
  {
    id: 3,
    type: 'inputText',
    label: 'alex@email.com',
    time: '00:07',
    selected: false,
    selectors: [
      {
        type: 'accessibilityId',
        value: 'input-login',
        stability: 'stable',
        recommended: true,
      },
      {
        type: 'resourceId',
        value: 'com.exemplo:id/username',
        stability: 'medium',
      },
      {
        type: 'androidUi',
        value: 'new UiSelector().resourceId("username")',
        stability: 'medium',
      },
      { type: 'text', value: 'Digite aqui', stability: 'medium' },
      {
        type: 'xpath',
        value: '//android.widget.EditText[1]',
        stability: 'fragile',
      },
      {
        type: 'coordinates',
        value: '[540, 576] · 1080×2400',
        stability: 'fragile',
      },
    ],
  },
  {
    id: 4,
    type: 'tap',
    label: 'Elemento "Digite sua senha"',
    time: '00:10',
    selected: true,
    selectors: [
      {
        type: 'accessibilityId',
        value: 'input-senha',
        stability: 'stable',
        recommended: true,
      },
      {
        type: 'resourceId',
        value: 'com.exemplo:id/password',
        stability: 'medium',
      },
      {
        type: 'xpath',
        value: '//android.widget.EditText[2]',
        stability: 'fragile',
      },
    ],
  },
  {
    id: 5,
    type: 'inputText',
    label: '••••••••',
    time: '00:12',
    selected: true,
    selectors: [
      {
        type: 'accessibilityId',
        value: 'input-senha',
        stability: 'stable',
        recommended: true,
      },
      {
        type: 'resourceId',
        value: 'com.exemplo:id/password',
        stability: 'medium',
      },
    ],
  },
  {
    id: 6,
    type: 'tap',
    label: 'Elemento "Entrar"',
    time: '00:14',
    selected: true,
    selectors: [
      {
        type: 'accessibilityId',
        value: 'btn-entrar',
        stability: 'stable',
        recommended: true,
      },
      { type: 'text', value: 'Entrar', stability: 'medium' },
      {
        type: 'xpath',
        value: '//android.widget.Button[@text="Entrar"]',
        stability: 'fragile',
      },
    ],
  },
  {
    id: 7,
    type: 'waitForElement',
    label: 'Elemento "Olá, Alex"',
    time: '00:16',
    selected: false,
    selectors: [
      {
        type: 'text',
        value: 'Olá, Alex',
        stability: 'medium',
        recommended: true,
      },
      {
        type: 'xpath',
        value: '//android.widget.TextView[@text="Olá, Alex"]',
        stability: 'fragile',
      },
    ],
  },
];

export const useStore = create<Store>((set) => ({
  project: 'App Exemplo',
  ambiente: 'HOMOLOG',
  device: 'Pixel 7 · Android 14',
  recorderPhase: 'gravar',
  recorderTitle: 'Login básico',
  recording: true,
  recordingSeconds: 64,
  steps: MOCK_STEPS,
  selectedStepId: 2,

  datasetRows: [
    {
      id: 'cliente_01',
      active: true,
      login: 'alex@email.com',
      senha: '••••••••••',
      saudacao: 'Olá, Alex',
      tipo: 'varejo',
    },
    {
      id: 'cliente_02',
      active: true,
      login: 'maria@email.com',
      senha: '••••••••••',
      saudacao: 'Olá, Maria',
      tipo: 'uniclass',
    },
    {
      id: 'cliente_03',
      active: true,
      login: 'carla@email.com',
      senha: '••••••••••',
      saudacao: 'Olá, Carla',
      tipo: 'varejo',
    },
  ],

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

  setRecorderPhase: (p) => set({ recorderPhase: p }),
  setSelectedStep: (id) => set({ selectedStepId: id }),
  setAmbiente: (a) => set({ ambiente: a }),
}));
