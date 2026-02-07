import React, { useState } from "react";
import type { Zone } from "../types";
import { ZONE_COLORS } from "../types";

interface Props {
  zone?: Zone;
  onSave: (data: { name: string; color: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ZoneDialog({ zone, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(zone?.name ?? "");
  const [color, setColor] = useState(zone?.color ?? ZONE_COLORS[0]!.value);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, color });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h2>{zone ? "Edit Zone" : "Add Zone"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Drum Riser"
              autoFocus
            />
          </div>
          <div className="dialog-field">
            <label>Color</label>
            <div className="color-grid">
              {ZONE_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-swatch ${color === c.value ? "selected" : ""}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
          {zone && onDelete && (
            <div className="dialog-actions">
              {confirmDelete ? (
                <button type="button" className="btn-danger confirm" onClick={onDelete}>
                  Confirm Delete
                </button>
              ) : (
                <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
                  Delete Zone
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
