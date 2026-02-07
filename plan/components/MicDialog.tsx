import React, { useState } from "react";
import type { Mic } from "../types";

interface Props {
  mic?: Mic;
  onSave: (data: { number: number; name: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function MicDialog({ mic, onSave, onDelete, onClose }: Props) {
  const [number, setNumber] = useState(mic?.number ?? 1);
  const [name, setName] = useState(mic?.name ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ number, name });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h2>{mic ? "Edit Mic" : "Add Mic"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label>Mic Number</label>
            <input
              type="number"
              value={number}
              onChange={e => setNumber(parseInt(e.target.value) || 0)}
              min={1}
              autoFocus
            />
          </div>
          <div className="dialog-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Lead Vocal"
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
          {mic && onDelete && (
            <div className="dialog-actions">
              {confirmDelete ? (
                <button type="button" className="btn-danger confirm" onClick={onDelete}>
                  Confirm Delete
                </button>
              ) : (
                <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
                  Delete Mic
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
