import type { Adb } from '@yume-chan/adb';

export interface IAdbPort {
  getAdb(): Adb | null;
}

let _current: IAdbPort | null = null;

export function setAdbPort(port: IAdbPort | null): void {
  _current = port;
}

export function getAdbPort(): IAdbPort | null {
  return _current;
}
