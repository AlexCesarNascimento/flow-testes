import { useEffect, useRef } from 'react';
import type { DeviceSnapshot } from '@/shared/lib/device-snapshot';
import './snapshot-preview.scss';

export function SnapshotPreview({
  snapshot,
  stepId,
  onClose,
}: {
  snapshot: DeviceSnapshot;
  stepId: number;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    const element = dialog.current!;
    element.showModal();
    return () => {
      element.close();
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="snapshot-preview"
      aria-label={`Captura do step ${stepId}`}
      onCancel={onClose}
    >
      <div className="snapshot-preview__header">
        <strong>Captura da tela · step {stepId}</strong>
        <button type="button" onClick={onClose} aria-label="Fechar captura">
          ×
        </button>
      </div>
      <img src={snapshot.dataUrl} alt={`Tela observada no step ${stepId}`} />
      <div className="snapshot-preview__footer">
        <span>
          Frame do espelhamento · {snapshot.width} × {snapshot.height} ·
          disponível nesta sessão
        </span>
        <a
          href={snapshot.dataUrl}
          download={`flowtest-tela-step-${stepId}.jpg`}
        >
          Baixar imagem
        </a>
      </div>
    </dialog>
  );
}
