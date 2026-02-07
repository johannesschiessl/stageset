import React, { useRef, useCallback } from "react";
import type { Mic, StageElement } from "../types";

const DRAG_THRESHOLD = 5;

const KIND_ICONS: Record<string, string> = {
  speaker: "\u{1F50A}",
  monitor: "\u{1F3A7}",
  di_box: "\u{1F50C}",
  custom: "\u{2B1B}",
};

interface Props {
  item: Mic | StageElement;
  isMic: boolean;
  onDragEnd: (id: number | string, x: number, y: number) => void;
  onTap: (item: Mic | StageElement) => void;
}

export function DraggableItem({ item, isMic, onDragEnd, onTap }: Props) {
  const startPos = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const moved = useRef(false);
  const posRef = useRef({ x: item.x, y: item.y });
  const elRef = useRef<HTMLDivElement>(null);

  // Update ref when item changes (from server)
  posRef.current = { x: item.x, y: item.y };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = elRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      elX: item.x,
      elY: item.y,
    };
    moved.current = false;
  }, [item.x, item.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!elRef.current?.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      moved.current = true;
    }
    if (moved.current) {
      const newX = Math.max(0, startPos.current.elX + dx);
      const newY = Math.max(0, startPos.current.elY + dy);
      posRef.current = { x: newX, y: newY };
      const el = elRef.current;
      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const el = elRef.current;
    if (!el?.hasPointerCapture(e.pointerId)) return;
    el.releasePointerCapture(e.pointerId);
    if (moved.current) {
      onDragEnd(item.id, posRef.current.x, posRef.current.y);
    } else {
      onTap(item);
    }
  }, [item.id, onDragEnd, onTap]);

  const kind = isMic ? "mic" : (item as StageElement).kind;

  return (
    <div
      ref={elRef}
      className={`stage-item ${kind}`}
      style={{ left: item.x, top: item.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {isMic ? (
        <>
          <span className="item-number">{(item as Mic).number}</span>
          {(item as Mic).name && <span className="item-label">{(item as Mic).name}</span>}
        </>
      ) : (
        <>
          <span className="item-icon">{KIND_ICONS[kind] ?? "\u{2B1B}"}</span>
          {(item as StageElement).label && <span className="item-label">{(item as StageElement).label}</span>}
        </>
      )}
    </div>
  );
}
