import { useRef, useState, type PointerEvent } from 'react';
import { Smartphone, GripVertical } from 'lucide-react';
import { useFlowStore } from '@/entities/flow';

export function MiniDevicePreview() {
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const dragOrigin = useRef<{ dx: number; dy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isPlaying = useFlowStore((s) => s.isPlaying);
  const currentNodeId = useFlowStore((s) => s.currentNodeId);
  const current = useFlowStore((s) =>
    currentNodeId ? s.nodes.find((n) => n.id === currentNodeId) : null,
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOrigin.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragOrigin.current) return;
    const parent = panelRef.current?.offsetParent as HTMLElement | null;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    setPos({
      x: e.clientX - parentRect.left - dragOrigin.current.dx,
      y: e.clientY - parentRect.top - dragOrigin.current.dy,
    });
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragOrigin.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const screenText = current?.data.label ?? '—';
  const screenKind = current?.data.kind ?? 'atomic';

  return (
    <div
      ref={panelRef}
      className="mini-device"
      style={{ left: pos.x, top: pos.y }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="mini-device__header"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <GripVertical size={12} aria-hidden="true" />
        <Smartphone size={12} aria-hidden="true" />
        <span className="mini-device__title">Device preview</span>
        <span
          className={`mini-device__status${isPlaying ? ' mini-device__status--on' : ''}`}
          aria-hidden="true"
        />
      </div>
      <div className="mini-device__frame">
        <div className="mini-device__notch" aria-hidden="true" />
        <div className="mini-device__screen" data-kind={screenKind}>
          {isPlaying ? (
            <>
              <div className="mini-device__step-label">Executando</div>
              <div className="mini-device__step-name">{screenText}</div>
            </>
          ) : (
            <div className="mini-device__idle">
              Pressione Play para simular o fluxo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
