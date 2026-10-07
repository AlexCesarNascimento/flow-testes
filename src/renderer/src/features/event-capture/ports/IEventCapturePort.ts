import type { ScreenSignature } from '../../../shared/lib/screen-signature/index.ts';

export type CapturedGesture = 'tap' | 'longPress' | 'swipe';

export type EnrichedFields = {
  resourceId: string;
  contentDesc: string;
  text: string;
  className: string;
  packageName: string;
  editable: boolean;
  kind:
    | 'input'
    | 'button'
    | 'toggle'
    | 'checkbox'
    | 'radio'
    | 'link'
    | 'image'
    | 'list-item'
    | 'text'
    | 'container';
};

export type CapturedEvent = {
  gesture: CapturedGesture;
  sourcePackage?: string;
  fromLauncher?: boolean;
  x: number; // pixels de tela (release)
  y: number;
  startX?: number; // pixels de tela (down) — presente em swipes
  startY?: number;
  durationMs: number;
  displayWidth: number; // dimensões da tela do device (px)
  displayHeight: number;
  /**
   * Promise que resolve com os dados do elemento tocado assim que o
   * `uiautomator dump` responder. Retorna `null` se o dump falhou ou não
   * achou elemento. O consumidor deve criar o step imediatamente e
   * atualizá-lo quando essa promise resolver.
   */
  enrich: Promise<EnrichedFields | null>;
};

export interface IEventCapturePort {
  startCapture(
    onEvent: (event: CapturedEvent) => void,
    onScreen?: (screen: ScreenSignature | null, isLauncher?: boolean) => void,
  ): Promise<void>;
  stopCapture(): Promise<void>;
}
