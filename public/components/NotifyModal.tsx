import React, { useEffect, useMemo, useState } from "react";
import { usePlan } from "../App";
import type { NotificationPreset } from "../types";
import { NotificationPresetDialog } from "./NotificationPresetDialog";

type DialogState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; preset: NotificationPreset };

interface Props {
  open: boolean;
  onClose: () => void;
  onSend: (presetId: number) => void;
}

export function NotifyModal({ open, onClose, onSend }: Props) {
  const { send, state } = usePlan();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [editing, setEditing] = useState(false);

  const presets = useMemo(
    () => [...state.notificationPresets].sort((a, b) => a.sort_order - b.sort_order),
    [state.notificationPresets],
  );

  useEffect(() => {
    if (!open) {
      setDialog({ type: "none" });
      setEditing(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (dialog.type !== "none") {
          setDialog({ type: "none" });
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, dialog.type, onClose]);

  if (!open) return null;

  const closeDialog = () => setDialog({ type: "none" });

  return (
    <>
      <div
        className="notify-modal-overlay"
        onClick={dialog.type === "none" ? onClose : undefined}
      >
        <div className="notify-modal" onClick={(e) => e.stopPropagation()}>
          <div className="notify-modal-header">
            <h2>Notifications</h2>
            <div className="notify-modal-header-actions">
              <button
                className={`notify-edit-toggle ${editing ? "active" : ""}`}
                onClick={() => setEditing((v) => !v)}
              >
                {"\u270E"} Edit
              </button>
              <button className="notify-modal-close" onClick={onClose}>
                {"\u2715"}
              </button>
            </div>
          </div>
          <div className="notify-grid">
            {editing && (
              <button
                className="notify-card notify-card-add"
                onClick={() => setDialog({ type: "add" })}
              >
                <span className="notify-card-plus">+</span>
                <span className="notify-card-add-label">New</span>
              </button>
            )}

            {presets.map((preset) => (
              <div
                key={preset.id}
                className={`notify-card ${editing ? "editing" : ""}`}
                style={{ borderTopColor: preset.color }}
              >
                <button
                  className="notify-card-trigger"
                  onClick={() => {
                    if (!editing) onSend(preset.id);
                  }}
                  style={editing ? { cursor: "default" } : undefined}
                >
                  <span className="notify-card-emoji">{preset.emoji}</span>
                  <span className="notify-card-label">{preset.label}</span>
                </button>
                {editing && (
                  <div className="notify-card-actions">
                    <button
                      className="notify-card-btn notify-card-edit"
                      title="Edit"
                      onClick={() => setDialog({ type: "edit", preset })}
                    >
                      {"\u270E"}
                    </button>
                    <button
                      className="notify-card-btn notify-card-delete"
                      title="Delete"
                      onClick={() =>
                        send({ type: "notificationPreset:delete", id: preset.id })
                      }
                    >
                      {"\u2715"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {dialog.type === "add" && (
        <NotificationPresetDialog
          onSave={(data) => {
            send({ type: "notificationPreset:create", data });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}

      {dialog.type === "edit" && (
        <NotificationPresetDialog
          preset={dialog.preset}
          onSave={(data) => {
            send({
              type: "notificationPreset:update",
              id: dialog.preset.id,
              data,
            });
            closeDialog();
          }}
          onDelete={() => {
            send({
              type: "notificationPreset:delete",
              id: dialog.preset.id,
            });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
