import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePlan } from "../App";
import type { Mic } from "../types";

interface Props {
  selectedMicIds: number[];
  onChange: (micIds: number[]) => void;
}

export function MicSelector({ selectedMicIds, onChange }: Props) {
  const { state } = usePlan();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const mics = Array.from(state.mics.values())
    .filter((m): m is Mic & { id: number } => typeof m.id === "number")
    .sort((a, b) => a.number - b.number);

  const toggle = (micId: number) => {
    const next = selectedMicIds.includes(micId)
      ? selectedMicIds.filter(id => id !== micId)
      : [...selectedMicIds, micId];
    onChange(next);
  };

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left });
  }, []);

  // Position dropdown when opened
  useEffect(() => {
    if (!open) return;
    updatePos();
  }, [open, updatePos]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const selectedMics = mics.filter(m => selectedMicIds.includes(m.id));

  return (
    <div>
      <button
        ref={btnRef}
        className="mic-selector-btn"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {selectedMics.length > 0 ? (
          selectedMics.map(m => (
            <span key={m.id} className="mic-number-badge" style={{ marginRight: 4 }}>{m.number}</span>
          ))
        ) : (
          <span style={{ color: "var(--text-muted)" }}>{"\u2014"}</span>
        )}
      </button>
      {open && createPortal(
        <div ref={dropdownRef} className="mic-selector-dropdown" style={{ top: pos.top, left: pos.left }}>
          {mics.length === 0 && (
            <div style={{ padding: "0.5rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              No mics added yet
            </div>
          )}
          {mics.map(mic => (
            <label key={mic.id} className="mic-selector-option">
              <input
                type="checkbox"
                checked={selectedMicIds.includes(mic.id)}
                onChange={() => toggle(mic.id)}
              />
              <span className="mic-number-badge">{mic.number}</span>
              <span>{mic.name || `Mic ${mic.number}`}</span>
            </label>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
