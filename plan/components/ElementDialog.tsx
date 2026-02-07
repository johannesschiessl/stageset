import React, { useState } from "react";
import type { StageElement } from "../types";

interface Props {
  element?: StageElement;
  defaultKind?: string;
  onSave: (data: { kind: string; label: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const KIND_LABELS: Record<string, string> = {
  speaker: "Speaker",
  monitor: "Monitor",
  di_box: "DI Box",
  custom: "Custom",
};

export function ElementDialog({ element, defaultKind, onSave, onDelete, onClose }: Props) {
  const [kind, setKind] = useState(element?.kind ?? defaultKind ?? "speaker");
  const [label, setLabel] = useState(element?.label ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ kind, label });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h2>{element ? "Edit Element" : `Add ${KIND_LABELS[defaultKind ?? "speaker"] ?? "Element"}`}</h2>
        <form onSubmit={handleSubmit}>
          {element && (
            <div className="dialog-field">
              <label>Type</label>
              <select value={kind} onChange={e => setKind(e.target.value)}>
                <option value="speaker">Speaker</option>
                <option value="monitor">Monitor</option>
                <option value="di_box">DI Box</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          )}
          <div className="dialog-field">
            <label>Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Main L"
              autoFocus
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
          {element && onDelete && (
            <div className="dialog-actions">
              {confirmDelete ? (
                <button type="button" className="btn-danger confirm" onClick={onDelete}>
                  Confirm Delete
                </button>
              ) : (
                <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
                  Delete Element
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
