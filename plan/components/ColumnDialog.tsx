import React, { useState } from "react";
import type { Column } from "../types";

interface Props {
  column?: Column;
  onSave: (data: { label: string; type: "mic" | "text"; key?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ColumnDialog({ column, onSave, onDelete, onClose }: Props) {
  const [label, setLabel] = useState(column?.label ?? "");
  const [type, setType] = useState<"mic" | "text">(column?.type ?? "text");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    const key = column?.key ?? label.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    onSave({ label: label.trim(), type, key });
  };

  const canDelete = column && !column.is_default;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h2>{column ? "Edit Column" : "Add Column"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label>Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Backing Vocals"
              autoFocus
            />
          </div>
          <div className="dialog-field">
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value as "mic" | "text")}>
              <option value="text">Text</option>
              <option value="mic">Mic Selector</option>
            </select>
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
          {canDelete && onDelete && (
            <div className="dialog-actions">
              {confirmDelete ? (
                <button type="button" className="btn-danger confirm" onClick={onDelete}>
                  Confirm Delete
                </button>
              ) : (
                <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
                  Delete Column
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
