import React, { useEffect, useMemo, useRef, useState } from "react";
import type { NotificationPreset } from "../types";

interface Props {
  open: boolean;
  presets: NotificationPreset[];
  onClose: () => void;
  onSend: (presetId: number) => void;
}

export function NotificationPopover({ open, presets, onClose, onSend }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => a.sort_order - b.sort_order),
    [presets],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
  }, [open, sortedPresets.length]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".notify-btn") || target.closest(".live-notify-btn")) {
        return;
      }
      if (!wrapRef.current?.contains(target)) {
        onClose();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (sortedPresets.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((idx) => (idx + 1) % sortedPresets.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((idx) => (idx - 1 + sortedPresets.length) % sortedPresets.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const preset = sortedPresets[selectedIndex];
        if (preset) {
          onSend(preset.id);
        }
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, onSend, open, selectedIndex, sortedPresets]);

  if (!open) return null;

  return (
    <div className="notify-popover" ref={wrapRef}>
      {sortedPresets.length === 0 ? (
        <div className="notify-popover-empty">No presets configured</div>
      ) : (
        sortedPresets.map((preset, idx) => (
          <button
            key={preset.id}
            className={`notify-popover-item ${idx === selectedIndex ? "selected" : ""}`}
            type="button"
            onMouseEnter={() => setSelectedIndex(idx)}
            onClick={() => onSend(preset.id)}
          >
            <span className="notify-popover-item-emoji">{preset.emoji}</span>
            <span className="notify-popover-item-label">{preset.label}</span>
          </button>
        ))
      )}
    </div>
  );
}
