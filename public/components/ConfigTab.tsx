import React, { useMemo, useState } from "react";
import { usePlan } from "../App";
import type { NotificationPreset } from "../types";
import { NotificationPresetDialog } from "./NotificationPresetDialog";

type DialogState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; preset: NotificationPreset };

export function ConfigTab() {
  const { state, send } = usePlan();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const presets = useMemo(
    () => [...state.notificationPresets].sort((a, b) => a.sort_order - b.sort_order),
    [state.notificationPresets],
  );

  const closeDialog = () => setDialog({ type: "none" });

  return (
    <div className="setlist config-list-view">
      <h2 className="config-section-heading">Notifications</h2>
      <div className="setlist-header-actions">
        <button className="add-row-btn" onClick={() => setDialog({ type: "add" })}>
          + Notification
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="empty-state">No notification presets yet</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="setlist-table config-table">
            <thead>
              <tr>
                <th>Preset</th>
                <th>Color</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {presets.map((preset) => (
                <tr key={preset.id}>
                  <td>
                    <div className="config-preset-cell">
                      <span className="config-preset-emoji" aria-hidden="true">
                        {preset.emoji}
                      </span>
                      <span className="config-preset-label">{preset.label}</span>
                    </div>
                  </td>
                  <td>
                    <div className="config-color-preview">
                      <span className="config-color-dot" style={{ backgroundColor: preset.color }} />
                      <span>{preset.color}</span>
                    </div>
                  </td>
                  <td>
                    <div className="row-controls">
                      <button
                        className="row-btn"
                        title="Edit notification"
                        onClick={() => setDialog({ type: "edit", preset })}
                      >
                        {"\u270E"}
                      </button>
                      <button
                        className="row-btn danger"
                        title="Delete notification"
                        onClick={() => {
                          send({ type: "notificationPreset:delete", id: preset.id });
                        }}
                      >
                        {"\u2715"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            send({ type: "notificationPreset:update", id: dialog.preset.id, data });
            closeDialog();
          }}
          onDelete={() => {
            send({ type: "notificationPreset:delete", id: dialog.preset.id });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
