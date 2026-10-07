export type DeviceSnapshot = {
  dataUrl: string;
  width: number;
  height: number;
  capturedAt: number;
};

let source: (() => HTMLCanvasElement | null) | null = null;

/** O espelhamento registra sua fonte somente enquanto há stream ativo. */
export function setSnapshotSource(next: typeof source): void {
  source = next;
}

/** Evidência reduzida do frame disponível, sem bloquear a captura com ADB. */
export function captureDeviceSnapshot(): DeviceSnapshot | null {
  const canvas = source?.();
  if (!canvas?.width || !canvas.height) return null;
  try {
    const scale = Math.min(1, 720 / Math.max(canvas.width, canvas.height));
    const thumbnail = document.createElement('canvas');
    thumbnail.width = Math.max(1, Math.round(canvas.width * scale));
    thumbnail.height = Math.max(1, Math.round(canvas.height * scale));
    const context = thumbnail.getContext('2d');
    if (!context) return null;
    context.drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
    const dataUrl = thumbnail.toDataURL('image/jpeg', 0.65);
    if (
      !dataUrl.startsWith('data:image/jpeg;base64,') ||
      dataUrl.length > 180_000
    )
      return null;
    return {
      dataUrl,
      width: thumbnail.width,
      height: thumbnail.height,
      capturedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
