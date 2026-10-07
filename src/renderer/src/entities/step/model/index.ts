import type { ScreenSignature } from '../../../shared/lib/screen-signature/index.ts';

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
  | 'secureKeypad'
  | 'waitForElement'
  | 'waitForPage'
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
  /**
   * true = seletor ainda sendo resolvido em background (uiautomator dump).
   * Step foi criado imediatamente ao capturar o toque, sem identidade
   * executável. Quando o dump resolve, o step é atualizado e pending vira
   * false.
   */
  pending?: boolean;
  screenSignature?: ScreenSignature;
  /** Espera após este step e antes do próximo, em milissegundos. */
  delayAfterMs?: number;
  /** Limite total personalizado da ação em ms (1 a 120 s). */
  timeoutMs?: number;
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
    selected: false,
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
    selected: false,
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
    selected: false,
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

/** Gravações antigas podem conter labels por coordenadas: não os apresente como identidade. */
export function stepDisplayLabel(step: Step): string {
  if (step.type === 'secureKeypad')
    return `Digitar senha no teclado${/^\{\{[a-zA-Z0-9_]+\}\}$/.test(step.value ?? '') ? ` · ${step.value}` : ''}`;
  if (
    ['tap', 'longPress', 'swipe'].includes(step.type) &&
    !step.selectors.some((s) =>
      ['resourceId', 'accessibilityId', 'text'].includes(s.type),
    )
  ) {
    return step.pending
      ? 'Identificando elemento…'
      : 'Elemento não identificado — grave novamente';
  }
  return step.label;
}
