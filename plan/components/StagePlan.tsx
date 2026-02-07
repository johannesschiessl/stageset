import React, { useState, useCallback } from "react";
import { usePlan } from "../App";
import { generateId } from "../types";
import type { Mic, StageElement } from "../types";
import { StagePlanToolbar } from "./StagePlanToolbar";
import { DraggableItem } from "./DraggableItem";
import { MicDialog } from "./MicDialog";
import { ElementDialog } from "./ElementDialog";

type DialogState =
  | { type: "none" }
  | { type: "addMic" }
  | { type: "editMic"; mic: Mic }
  | { type: "addElement"; kind: "speaker" | "monitor" | "di_box" }
  | { type: "editElement"; element: StageElement };

export function StagePlan() {
  const { state, send } = usePlan();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const handleAddMic = () => setDialog({ type: "addMic" });
  const handleAddElement = (kind: "speaker" | "monitor" | "di_box") => setDialog({ type: "addElement", kind });

  const handleMicDragEnd = useCallback((id: number | string, x: number, y: number) => {
    send({ type: "mic:update", id, data: { x, y } });
  }, [send]);

  const handleElementDragEnd = useCallback((id: number | string, x: number, y: number) => {
    send({ type: "element:update", id, data: { x, y } });
  }, [send]);

  const handleMicTap = useCallback((item: Mic | StageElement) => {
    setDialog({ type: "editMic", mic: item as Mic });
  }, []);

  const handleElementTap = useCallback((item: Mic | StageElement) => {
    setDialog({ type: "editElement", element: item as StageElement });
  }, []);

  const closeDialog = () => setDialog({ type: "none" });

  const mics = Array.from(state.mics.values());
  const elements = Array.from(state.elements.values());

  return (
    <div className="stage-plan">
      <StagePlanToolbar onAddMic={handleAddMic} onAddElement={handleAddElement} />
      <div className="stage-canvas">
        {mics.map(mic => (
          <DraggableItem
            key={String(mic.id)}
            item={mic}
            isMic={true}
            onDragEnd={handleMicDragEnd}
            onTap={handleMicTap}
          />
        ))}
        {elements.map(el => (
          <DraggableItem
            key={String(el.id)}
            item={el}
            isMic={false}
            onDragEnd={handleElementDragEnd}
            onTap={handleElementTap}
          />
        ))}
        <div className="stage-front-label">Front of Stage</div>
      </div>

      {dialog.type === "addMic" && (
        <MicDialog
          onSave={data => {
            const tempId = generateId();
            send({ type: "mic:create", tempId, data });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}

      {dialog.type === "editMic" && (
        <MicDialog
          mic={dialog.mic}
          onSave={data => {
            send({ type: "mic:update", id: dialog.mic.id, data });
            closeDialog();
          }}
          onDelete={() => {
            send({ type: "mic:delete", id: dialog.mic.id });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}

      {dialog.type === "addElement" && (
        <ElementDialog
          defaultKind={dialog.kind}
          onSave={data => {
            const tempId = generateId();
            send({ type: "element:create", tempId, data: { ...data, kind: dialog.kind } });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}

      {dialog.type === "editElement" && (
        <ElementDialog
          element={dialog.element}
          onSave={data => {
            send({ type: "element:update", id: dialog.element.id, data });
            closeDialog();
          }}
          onDelete={() => {
            send({ type: "element:delete", id: dialog.element.id });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
