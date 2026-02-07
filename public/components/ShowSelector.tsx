import React, { useState, useRef, useEffect } from "react";

interface Props {
  shows: string[];
  onSelect: (name: string) => void;
  onCreate: (name: string) => void;
  onDelete: (name: string) => void;
  loading: boolean;
}

export function ShowSelector({ shows, onSelect, onCreate, onDelete, loading }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName("");
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="show-selector">
        <div className="show-selector-header">
          <h1>Stageset</h1>
          <span className="show-selector-subtitle">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="show-selector">
      <div className="show-selector-header">
        <h1>Stageset</h1>
        <span className="show-selector-subtitle">Select Show</span>
      </div>

      {shows.length === 0 && !creating ? (
        <div className="show-selector-empty">No shows yet</div>
      ) : (
        <div className="show-selector-list">
          {shows.map((name) => (
            <div key={name} className="show-selector-item" onClick={() => onSelect(name)}>
              <span className="show-selector-name">{name}</span>
              <button
                className="show-selector-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(name);
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      {creating ? (
        <div className="show-selector-input-wrap">
          <input
            ref={inputRef}
            className="show-selector-input"
            type="text"
            placeholder="SHOW NAME"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setCreating(false); setNewName(""); }
            }}
          />
          <div className="show-selector-input-actions">
            <button className="show-selector-create-btn" onClick={handleCreate}>Create</button>
            <button className="show-selector-cancel-btn" onClick={() => { setCreating(false); setNewName(""); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="show-selector-new" onClick={() => setCreating(true)}>
          + New Show
        </button>
      )}
    </div>
  );
}
