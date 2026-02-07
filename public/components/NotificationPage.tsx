import { useEffect, useMemo, useState } from "react";
import { usePlan } from "../App";
import type { NotificationPreset } from "../types";
import { NotificationPresetDialog } from "./NotificationPresetDialog";

type DialogState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; preset: NotificationPreset };

interface Props {
  onSend: (presetId: number) => void;
}

export function NotificationPage({ onSend }: Props) {
  const { send, state } = usePlan();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [editing, setEditing] = useState(false);

  const presets = useMemo(
    () =>
      [...state.notificationPresets].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    [state.notificationPresets],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dialog.type !== "none") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setDialog({ type: "none" });
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [dialog.type]);

  const closeDialog = () => setDialog({ type: "none" });

  return (
    <>
      <div className="notify-modal notification-page-modal">
        <div className="notify-modal-header">
          <h2>Notifications</h2>
          <div className="notify-modal-header-actions">
            <button
              className={`notify-edit-toggle ${editing ? "active" : ""}`}
              onClick={() => setEditing((v) => !v)}
            >
              {"\u270E"} Edit
            </button>
            <a
              className="notify-modal-close notify-modal-close-link"
              href="/"
              title="Back"
            >
              {"\u2715"}
            </a>
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
