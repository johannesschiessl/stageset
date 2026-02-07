import React, { useRef, useCallback } from "react";
import type { Mic, StageElement } from "../types";

const DRAG_THRESHOLD = 5;
const MIN_SIZE = 40;

const KIND_ICONS: Record<string, string> = {
  speaker: "\u{1F50A}",
  monitor: "\u{1F3A7}",
  stagebox: "\u{1F4E6}",
  mixer: "\u{1F39B}",
};

interface Props {
  item: Mic | StageElement;
  isMic: boolean;
  scale: number;
  canvasOffset: number;
  onDragEnd: (id: number | string, x: number, y: number) => void;
  onTap: (item: Mic | StageElement) => void;
  onResize?: (id: number | string, width: number, height: number) => void;
}

export function DraggableItem({ item, isMic, scale, canvasOffset, onDragEnd, onTap, onResize }: Props) {
  const startPos = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const moved = useRef(false);
  const posRef = useRef({ x: item.x, y: item.y });
  const elRef = useRef<HTMLDivElement>(null);

  posRef.current = { x: item.x, y: item.y };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
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
    const rawDx = e.clientX - startPos.current.x;
    const rawDy = e.clientY - startPos.current.y;
    const dx = rawDx / scale;
    const dy = rawDy / scale;
    if (Math.abs(rawDx) > DRAG_THRESHOLD || Math.abs(rawDy) > DRAG_THRESHOLD) {
      moved.current = true;
    }
    if (moved.current) {
      const newX = startPos.current.elX + dx;
      const newY = startPos.current.elY + dy;
      posRef.current = { x: newX, y: newY };
      const el = elRef.current;
      el.style.left = `${newX + canvasOffset}px`;
      el.style.top = `${newY + canvasOffset}px`;
    }
  }, [canvasOffset, scale]);

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
  const isResizable = !isMic && ((item as StageElement).kind === "object");
  const el = item as StageElement;
  const hasSize = !isMic && el.width > 0 && el.height > 0;

  const sizeStyle = hasSize ? { width: el.width, height: el.height } : {};

  return (
    <div
      ref={elRef}
      className={`stage-item ${kind}`}
      style={{ left: item.x + canvasOffset, top: item.y + canvasOffset, ...sizeStyle }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {isMic ? (
        <>
          <span className="item-number">{(item as Mic).number}</span>
          {(item as Mic).name && <span className="item-label">{(item as Mic).name}</span>}
        </>
      ) : (item as StageElement).kind === "object" ? (
        <span className="item-label object-label">{(item as StageElement).label || "OBJECT"}</span>
      ) : (
        <>
          <span className="item-icon">{KIND_ICONS[kind] ?? "\u{2B1B}"}</span>
          {(item as StageElement).label && <span className="item-label">{(item as StageElement).label}</span>}
        </>
      )}
      {isResizable && onResize && (
        <ResizeHandle itemId={item.id} parentRef={elRef} onResize={onResize} scale={scale} />
      )}
    </div>
  );
}

function ResizeHandle({ itemId, parentRef, onResize, scale }: {
  itemId: number | string;
  parentRef: React.RefObject<HTMLDivElement | null>;
  onResize: (id: number | string, w: number, h: number) => void;
  scale: number;
}) {
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const handleRef = useRef<HTMLDivElement>(null);

  const handleDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const handle = handleRef.current;
    const parent = parentRef.current;
    if (!handle || !parent) return;
    handle.setPointerCapture(e.pointerId);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: parent.offsetWidth,
      h: parent.offsetHeight,
    };
  }, [parentRef]);

  const handleMove = useCallback((e: React.PointerEvent) => {
    const handle = handleRef.current;
    const parent = parentRef.current;
    if (!handle?.hasPointerCapture(e.pointerId) || !parent) return;
    const dx = (e.clientX - startRef.current.x) / scale;
    const dy = (e.clientY - startRef.current.y) / scale;
    const newW = Math.max(MIN_SIZE, startRef.current.w + dx);
    const newH = Math.max(MIN_SIZE, startRef.current.h + dy);
    parent.style.width = `${newW}px`;
    parent.style.height = `${newH}px`;
  }, [parentRef, scale]);

  const handleUp = useCallback((e: React.PointerEvent) => {
    const handle = handleRef.current;
    const parent = parentRef.current;
    if (!handle?.hasPointerCapture(e.pointerId) || !parent) return;
    handle.releasePointerCapture(e.pointerId);
    onResize(itemId, parent.offsetWidth, parent.offsetHeight);
  }, [itemId, onResize, parentRef]);

  return (
    <div
      ref={handleRef}
      className="resize-handle"
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
    />
  );
}
