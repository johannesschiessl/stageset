import React, { useState, useRef, useEffect } from "react";

type ElementKind = "speaker" | "monitor" | "stagebox" | "mixer" | "object";

interface Props {
  onAddMic: () => void;
  onAddElement: (kind: ElementKind) => void;
  onAddZone: () => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function StagePlanToolbar({ onAddMic, onAddElement, onAddZone, zoomPercent, onZoomIn, onZoomOut }: Props) {
  const [equipOpen, setEquipOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!equipOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setEquipOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [equipOpen]);

  return (
    <div className="stage-toolbar">
      <button className="toolbar-btn mic" onClick={onAddMic}>+ Mic</button>
      <button className="toolbar-btn speaker" onClick={() => onAddElement("speaker")}>+ Speaker</button>
      <button className="toolbar-btn monitor" onClick={() => onAddElement("monitor")}>+ Monitor</button>

      <div className="toolbar-popover-wrap" ref={popRef}>
        <button
          className={`toolbar-btn equipment ${equipOpen ? "active" : ""}`}
          onClick={() => setEquipOpen(!equipOpen)}
        >
          + Equipment
        </button>
        {equipOpen && (
          <div className="toolbar-popover">
            <button className="toolbar-popover-item stagebox" onClick={() => { onAddElement("stagebox"); setEquipOpen(false); }}>
              Stagebox
            </button>
            <button className="toolbar-popover-item mixer" onClick={() => { onAddElement("mixer"); setEquipOpen(false); }}>
              Mixer
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-separator" />

      <button className="toolbar-btn object" onClick={() => onAddElement("object")}>+ Object</button>
      <button className="toolbar-btn zone" onClick={onAddZone}>+ Zone</button>

      <div className="toolbar-separator" />

      <button className="toolbar-btn zoom" onClick={onZoomOut}>- Zoom</button>
      <button className="toolbar-btn zoom" onClick={onZoomIn}>+ Zoom</button>
      <span className="toolbar-zoom-readout">{zoomPercent}%</span>
    </div>
  );
}
