import React from "react";

interface Props {
  onAddMic: () => void;
  onAddElement: (kind: "speaker" | "monitor" | "di_box") => void;
}

export function StagePlanToolbar({ onAddMic, onAddElement }: Props) {
  return (
    <div className="stage-toolbar">
      <button className="toolbar-btn mic" onClick={onAddMic}>+ Mic</button>
      <button className="toolbar-btn speaker" onClick={() => onAddElement("speaker")}>+ Speaker</button>
      <button className="toolbar-btn monitor" onClick={() => onAddElement("monitor")}>+ Monitor</button>
      <button className="toolbar-btn di" onClick={() => onAddElement("di_box")}>+ DI Box</button>
    </div>
  );
}
