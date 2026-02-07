import React, { useState, useCallback } from "react";
import { usePlan } from "../App";
import { generateId } from "../types";
import type { Column } from "../types";
import { SetlistRow } from "./SetlistRow";
import { ColumnDialog } from "./ColumnDialog";

type DialogState =
  | { type: "none" }
  | { type: "addColumn" }
  | { type: "editColumn"; column: Column };

export function Setlist() {
  const { state, send } = usePlan();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const songs = state.songs;
  const columns = state.columns;

  const handleAddSong = () => {
    const tempId = generateId();
    send({ type: "song:create", tempId, data: { title: "", artist: "" } });
  };

  const handleDeleteSong = useCallback((id: number | string) => {
    send({ type: "song:delete", id });
  }, [send]);

  const handleMoveSong = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= songs.length) return;
    const ids = songs.map(s => s.id as number);
    [ids[index]!, ids[newIndex]!] = [ids[newIndex]!, ids[index]!];
    send({ type: "songs:reorder", order: ids });
  }, [send, songs]);

  const closeDialog = () => setDialog({ type: "none" });

  return (
    <div className="setlist">
      <div className="setlist-header-actions">
        <button className="add-col-btn" onClick={() => setDialog({ type: "addColumn" })}>
          + Column
        </button>
      </div>
      {songs.length === 0 && columns.length === 0 ? (
        <div className="empty-state">No songs yet. Add one below.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="setlist-table">
            <thead>
              <tr>
                <th>Song</th>
                {columns.map(col => (
                  <th key={col.id}>
                    <span
                      className="col-header-label"
                      onClick={() => setDialog({ type: "editColumn", column: col })}
                      title="Click to edit"
                    >
                      {col.label}
                    </span>
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, i) => (
                <SetlistRow
                  key={String(song.id)}
                  song={song}
                  columns={columns}
                  index={i}
                  totalSongs={songs.length}
                  onMoveUp={() => handleMoveSong(i, -1)}
                  onMoveDown={() => handleMoveSong(i, 1)}
                  onDelete={() => handleDeleteSong(song.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button className="add-row-btn" onClick={handleAddSong}>+ Add Song</button>

      {dialog.type === "addColumn" && (
        <ColumnDialog
          onSave={data => {
            const tempId = generateId();
            send({ type: "column:create", tempId, data });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}

      {dialog.type === "editColumn" && (
        <ColumnDialog
          column={dialog.column}
          onSave={data => {
            send({ type: "column:update", id: dialog.column.id, data });
            closeDialog();
          }}
          onDelete={() => {
            send({ type: "column:delete", id: dialog.column.id });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
