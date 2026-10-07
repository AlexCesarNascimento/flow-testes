export type GetEventLine =
  | { kind: 'pos_x'; value: number; ts: number }
  | { kind: 'pos_y'; value: number; ts: number }
  | { kind: 'finger_down'; ts: number }
  | { kind: 'finger_up'; ts: number };

const TIMESTAMP_RE = /^\[\s*(\d+\.\d+)\]/;
const HEX_TAIL_RE = /([0-9a-fA-F]{1,8})\s*$/;

function parseTimestamp(line: string): number | null {
  const m = line.match(TIMESTAMP_RE);
  return m ? parseFloat(m[1]) : null;
}

function parseHexTail(line: string): number | null {
  const m = line.match(HEX_TAIL_RE);
  return m ? parseInt(m[1], 16) : null;
}

/**
 * Parseia uma linha do `getevent -lt`. Suporta linhas com prefixo de device
 * (`/dev/input/eventN:`) e sem prefixo (quando o comando roda para device específico).
 *
 * ABS_MT_TRACKING_ID = 0xffffffff (-1) marca finger_up.
 * Qualquer outro valor (00000001, etc.) marca finger_down (novo tracking slot).
 */
export function parseGetEventLine(line: string): GetEventLine | null {
  const ts = parseTimestamp(line);
  if (ts === null) return null;

  if (line.includes('ABS_MT_POSITION_X')) {
    const value = parseHexTail(line);
    if (value !== null) return { kind: 'pos_x', value, ts };
  }
  if (line.includes('ABS_MT_POSITION_Y')) {
    const value = parseHexTail(line);
    if (value !== null) return { kind: 'pos_y', value, ts };
  }
  if (line.includes('ABS_MT_TRACKING_ID')) {
    if (/ffffffff/i.test(line)) return { kind: 'finger_up', ts };
    return { kind: 'finger_down', ts };
  }
  return null;
}
