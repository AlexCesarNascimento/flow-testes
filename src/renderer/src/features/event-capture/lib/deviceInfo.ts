import type { Adb } from '@yume-chan/adb';

export type DisplayInfo = { width: number; height: number };
export type InputDevice = { path: string; maxX: number; maxY: number };

/**
 * Retorna as dimensões da tela (px). Prefere `Override size` (definido por
 * `wm size WxH`) sobre `Physical size` (resolução nativa).
 */
export async function getDisplaySize(adb: Adb): Promise<DisplayInfo | null> {
  try {
    const out = await adb.subprocess.noneProtocol.spawnWaitText(['wm', 'size']);
    return parseWmSize(out);
  } catch (err) {
    console.warn('[EventCapture] wm size falhou:', err);
    return null;
  }
}

export function parseWmSize(output: string): DisplayInfo | null {
  const override = output.match(/Override size:\s*(\d+)x(\d+)/i);
  if (override) return { width: +override[1], height: +override[2] };
  const physical = output.match(/Physical size:\s*(\d+)x(\d+)/i);
  if (physical) return { width: +physical[1], height: +physical[2] };
  return null;
}

/**
 * Descobre o device de touch primário rodando `getevent -pl` e procurando o
 * primeiro que declara ABS_MT_POSITION_X e ABS_MT_POSITION_Y. Retorna o path
 * (ex.: `/dev/input/event5`) e os valores máximos, necessários para escalar
 * coordenadas do painel para pixels de tela.
 */
export async function findTouchDevice(adb: Adb): Promise<InputDevice | null> {
  try {
    const out = await adb.subprocess.noneProtocol.spawnWaitText([
      'getevent',
      '-pl',
    ]);
    return parseGetEventPl(out);
  } catch (err) {
    console.warn('[EventCapture] getevent -pl falhou:', err);
    return null;
  }
}

export function parseGetEventPl(output: string): InputDevice | null {
  const sections = output.split(/add device \d+:\s*/);

  for (const section of sections) {
    const pathMatch = section.match(/^(\/dev\/input\/event\d+)/);
    if (!pathMatch) continue;

    const maxX = findAxisMax(section, 'ABS_MT_POSITION_X', '0035');
    const maxY = findAxisMax(section, 'ABS_MT_POSITION_Y', '0036');
    if (maxX && maxY) {
      return { path: pathMatch[1], maxX, maxY };
    }
  }
  return null;
}

function findAxisMax(
  section: string,
  label: string,
  hexCode: string,
): number | null {
  const byLabel = section.match(
    new RegExp(`${label}[^\\n]*?max\\s+(\\d+)`, 'i'),
  );
  if (byLabel) return parseInt(byLabel[1], 10);
  const byHex = section.match(
    new RegExp(`\\b${hexCode}\\b[^\\n]*?max\\s+(\\d+)`, 'i'),
  );
  if (byHex) return parseInt(byHex[1], 10);
  return null;
}
