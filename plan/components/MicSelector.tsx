import React, { useState, useRef, useEffect } from "react";
import { usePlan } from "../App";
import type { Mic } from "../types";

interface Props {
  selectedMicIds: number[];
  onChange: (micIds: number[]) => void;
}

export function MicSelector({ selectedMicIds, onChange }: Props) {
  const { state } = usePlan();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mics = Array.from(state.mics.values())
    .filter((m): m is Mic & { id: number } => typeof m.id === "number")
    .sort((a, b) => a.number - b.number);

  const toggle = (micId: number) => {
    const next = selectedMicIds.includes(micId)
      ? selectedMicIds.filter(id => id !== micId)
      : [...selectedMicIds, micId];
    onChange(next);
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const selectedMics = mics.filter(m => selectedMicIds.includes(m.id));
  const label = selectedMics.length > 0
    ? selectedMics.map(m => m.number).join(", ")
    : "\u2014";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
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
      {open && (
        <div className="mic-selector-dropdown">
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
        </div>
      )}
    </div>
  );
}
