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

export const MOCK_STEPS: Step[] = [
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
