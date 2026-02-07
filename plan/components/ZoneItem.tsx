import React, { useRef, useCallback } from "react";
import type { Zone } from "../types";

const DRAG_THRESHOLD = 5;
const MIN_SIZE = 60;

interface Props {
  zone: Zone;
  onDragEnd: (id: number | string, x: number, y: number) => void;
  onResize: (id: number | string, width: number, height: number) => void;
  onTap: (zone: Zone) => void;
}

export function ZoneItem({ zone, onDragEnd, onResize, onTap }: Props) {
  const startPos = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const moved = useRef(false);
  const posRef = useRef({ x: zone.x, y: zone.y });
  const elRef = useRef<HTMLDivElement>(null);

  posRef.current = { x: zone.x, y: zone.y };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    e.preventDefault();
    e.stopPropagation();
    const el = elRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY, elX: zone.x, elY: zone.y };
    moved.current = false;
  }, [zone.x, zone.y]);

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
      onDragEnd(zone.id, posRef.current.x, posRef.current.y);
    } else {
      onTap(zone);
    }
  }, [zone.id, onDragEnd, onTap]);

  // Resize handle
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const handleRef = useRef<HTMLDivElement>(null);

  const resizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const handle = handleRef.current;
    const parent = elRef.current;
    if (!handle || !parent) return;
    handle.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, w: parent.offsetWidth, h: parent.offsetHeight };
  }, []);

  const resizeMove = useCallback((e: React.PointerEvent) => {
    const handle = handleRef.current;
    const parent = elRef.current;
    if (!handle?.hasPointerCapture(e.pointerId) || !parent) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    parent.style.width = `${Math.max(MIN_SIZE, startRef.current.w + dx)}px`;
    parent.style.height = `${Math.max(MIN_SIZE, startRef.current.h + dy)}px`;
  }, []);

  const resizeUp = useCallback((e: React.PointerEvent) => {
    const handle = handleRef.current;
    const parent = elRef.current;
    if (!handle?.hasPointerCapture(e.pointerId) || !parent) return;
    handle.releasePointerCapture(e.pointerId);
    onResize(zone.id, parent.offsetWidth, parent.offsetHeight);
  }, [zone.id, onResize]);

  return (
    <div
      ref={elRef}
      className="zone-item"
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        borderColor: zone.color,
        backgroundColor: zone.color + "15",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <span className="zone-name" style={{ color: zone.color }}>{zone.name || "ZONE"}</span>
      <div
        ref={handleRef}
        className="resize-handle"
        style={{ borderColor: zone.color }}
        onPointerDown={resizeDown}
        onPointerMove={resizeMove}
        onPointerUp={resizeUp}
      />
    </div>
  );
}
