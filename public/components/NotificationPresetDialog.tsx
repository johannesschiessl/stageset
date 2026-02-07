import React, { useState } from "react";
import type { NotificationPreset } from "../types";
import { NOTIFICATION_COLORS } from "../types";

interface Props {
  preset?: NotificationPreset;
  onSave: (data: { label: string; emoji: string; color: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function NotificationPresetDialog({ preset, onSave, onDelete, onClose }: Props) {
  const [label, setLabel] = useState(preset?.label ?? "");
  const [emoji, setEmoji] = useState(preset?.emoji ?? "🔔");
  const [color, setColor] = useState(preset?.color ?? NOTIFICATION_COLORS[0]!.value);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    const trimmedEmoji = emoji.trim();
    if (!trimmedLabel || !trimmedEmoji) return;
    onSave({ label: trimmedLabel, emoji: trimmedEmoji, color });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{preset ? "Edit Notification" : "Add Notification"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label>Text</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Band to stage"
              autoFocus
              maxLength={80}
              required
            />
          </div>
          <div className="dialog-field">
            <label>Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🔔"
              maxLength={8}
              required
            />
          </div>
          <div className="dialog-field">
            <label>Color</label>
            <div className="color-grid">
              {NOTIFICATION_COLORS.map((c) => (
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
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
          {preset && onDelete && (
            <div className="dialog-actions">
              {confirmDelete ? (
                <button type="button" className="btn-danger confirm" onClick={onDelete}>
                  Confirm Delete
                </button>
              ) : (
                <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
                  Delete Notification
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
