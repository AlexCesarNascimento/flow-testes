import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActionStore } from '@/entities/action';
import type { Step } from '@/entities/step';
import { useRecorderStore } from '@/entities/recorder';
import './save-block-dialog.scss';

export function SaveBlockDialog({
  steps,
  defaultName,
  onClose,
}: {
  steps: Step[];
  defaultName: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [folder, setFolder] = useState('Meus blocos');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const saving = useRef(false);
  const navigate = useNavigate();
  const addAction = useActionStore((s) => s.addAction);
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
      className="save-block-dialog"
      aria-labelledby="save-block-title"
      onCancel={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const recorder = useRecorderStore.getState();
          if (recorder.recording || recorder.playbackRunning) return;
          if (
            saving.current ||
            !name.trim() ||
            !steps.length ||
            steps.some((step) => step.pending)
          )
            return;
          saving.current = true;
          try {
            const saved = addAction({
              name: name.trim(),
              folder: folder.trim() || 'Meus blocos',
              steps,
              paramColumns: [],
            });
            onClose();
            navigate(`/flows?bloco=${encodeURIComponent(saved.id)}`);
          } catch {
            saving.current = false;
            setError(
              'Não foi possível salvar o bloco neste computador. A gravação foi preservada.',
            );
          }
        }}
      >
        <h2 id="save-block-title">Salvar bloco em Flows</h2>
        <p>
          {steps.length}{' '}
          {steps.length === 1 ? 'step configurado' : 'steps configurados'} serão
          salvos como um bloco reutilizável.
        </p>
        <label>
          Nome do bloco
          <input
            autoFocus
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Pasta
          <input
            maxLength={100}
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="save-block-dialog__actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              !name.trim() ||
              !steps.length ||
              steps.some((step) => step.pending)
            }
          >
            Salvar e abrir Flows
          </button>
        </div>
      </form>
    </dialog>
  );
}
