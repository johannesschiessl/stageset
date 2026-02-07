import React, { useState, useCallback } from "react";
import { usePlan } from "../App";
import { generateId } from "../types";
import type { Mic, StageElement, Zone } from "../types";
import { StagePlanToolbar } from "./StagePlanToolbar";
import { DraggableItem } from "./DraggableItem";
import { ZoneItem } from "./ZoneItem";
import { MicDialog } from "./MicDialog";
import { ElementDialog } from "./ElementDialog";
import { ZoneDialog } from "./ZoneDialog";

type ElementKind = "speaker" | "monitor" | "stagebox" | "mixer" | "object";

type DialogState =
  | { type: "none" }
  | { type: "addMic" }
  | { type: "editMic"; mic: Mic }
  | { type: "addElement"; kind: ElementKind }
  | { type: "editElement"; element: StageElement }
  | { type: "addZone" }
  | { type: "editZone"; zone: Zone };

export function StagePlan() {
  const { state, send } = usePlan();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const handleAddMic = () => setDialog({ type: "addMic" });
  const handleAddElement = (kind: ElementKind) => setDialog({ type: "addElement", kind });
  const handleAddZone = () => setDialog({ type: "addZone" });

  const handleMicDragEnd = useCallback((id: number | string, x: number, y: number) => {
    send({ type: "mic:update", id, data: { x, y } });
  }, [send]);

  const handleElementDragEnd = useCallback((id: number | string, x: number, y: number) => {
    send({ type: "element:update", id, data: { x, y } });
  }, [send]);

  const handleElementResize = useCallback((id: number | string, width: number, height: number) => {
    send({ type: "element:update", id, data: { width, height } });
  }, [send]);

  const handleZoneDragEnd = useCallback((id: number | string, x: number, y: number) => {
    send({ type: "zone:update", id, data: { x, y } });
  }, [send]);

  const handleZoneResize = useCallback((id: number | string, width: number, height: number) => {
    send({ type: "zone:update", id, data: { width, height } });
  }, [send]);

  const handleMicTap = useCallback((item: Mic | StageElement) => {
    setDialog({ type: "editMic", mic: item as Mic });
  }, []);

  const handleElementTap = useCallback((item: Mic | StageElement) => {
    setDialog({ type: "editElement", element: item as StageElement });
  }, []);

  const handleZoneTap = useCallback((zone: Zone) => {
    setDialog({ type: "editZone", zone });
  }, []);

  const closeDialog = () => setDialog({ type: "none" });

  const mics = Array.from(state.mics.values());
  const elements = Array.from(state.elements.values());
  const zones = Array.from(state.zones.values());

  // Split elements: objects render behind, rest on top
  const objects = elements.filter(el => el.kind === "object");
  const equipment = elements.filter(el => el.kind !== "object");

  return (
    <div className="stage-plan">
      <StagePlanToolbar onAddMic={handleAddMic} onAddElement={handleAddElement} onAddZone={handleAddZone} />
      <div className="stage-canvas">
        {/* Layer 1: Zones (lowest) */}
        {zones.map(zone => (
          <ZoneItem
            key={String(zone.id)}
            zone={zone}
            onDragEnd={handleZoneDragEnd}
            onResize={handleZoneResize}
            onTap={handleZoneTap}
          />
        ))}

        {/* Layer 2: Objects */}
        {objects.map(el => (
          <DraggableItem
            key={String(el.id)}
            item={el}
            isMic={false}
            onDragEnd={handleElementDragEnd}
            onTap={handleElementTap}
            onResize={handleElementResize}
          />
        ))}

        {/* Layer 3: Mics */}
        {mics.map(mic => (
          <DraggableItem
            key={String(mic.id)}
            item={mic}
            isMic={true}
            onDragEnd={handleMicDragEnd}
            onTap={handleMicTap}
          />
        ))}

        {/* Layer 3: Equipment (speakers, monitors, stageboxes, mixers) */}
        {equipment.map(el => (
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

      {dialog.type === "addZone" && (
        <ZoneDialog
          onSave={data => {
            const tempId = generateId();
            send({ type: "zone:create", tempId, data });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}

      {dialog.type === "editZone" && (
        <ZoneDialog
          zone={dialog.zone}
          onSave={data => {
            send({ type: "zone:update", id: dialog.zone.id, data });
            closeDialog();
          }}
          onDelete={() => {
            send({ type: "zone:delete", id: dialog.zone.id });
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
