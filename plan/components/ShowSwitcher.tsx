import React, { useState, useRef, useEffect } from "react";

interface Props {
  currentShow: string;
  shows: string[];
  onSwitch: (name: string) => void;
  onCreate: (name: string) => void;
}

export function ShowSwitcher({ currentShow, shows, onSwitch, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

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
    setOpen(false);
  };

  return (
    <div className="toolbar-popover-wrap" ref={popRef}>
      <button className="show-switcher-btn" onClick={() => setOpen(!open)}>
        <span className="show-switcher-title">Stageset</span>
        <span className="show-switcher-show">{currentShow}</span>
      </button>
      {open && (
        <div className="show-switcher-popover">
          {shows.map((name) => (
            <button
              key={name}
              className={`show-switcher-item${name === currentShow ? " active" : ""}`}
              onClick={() => {
                onSwitch(name);
                setOpen(false);
              }}
            >
              {name}
            </button>
          ))}
          <div className="show-switcher-divider" />
          {creating ? (
            <div className="show-switcher-item new-input">
              <input
                ref={inputRef}
                type="text"
                placeholder="SHOW NAME"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
              />
              <button className="show-switcher-create-btn" onClick={handleCreate}>OK</button>
            </div>
          ) : (
            <button
              className="show-switcher-item new"
              onClick={() => setCreating(true)}
            >
              + New Show
            </button>
          )}
        </div>
      )}
    </div>
  );
}
