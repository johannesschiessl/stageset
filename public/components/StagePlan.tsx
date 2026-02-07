import React, { useState, useCallback, useLayoutEffect, useRef } from "react";
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

const CANVAS_SIZE = 16000;
const CANVAS_HALF = CANVAS_SIZE / 2;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.2;

function clampZoom(value: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

export function StagePlan() {
  const { state, send } = usePlan();
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const centeredRef = useRef(false);
  const panRef = useRef({ active: false, pointerId: 0, startX: 0, startY: 0, startScrollLeft: 0, startScrollTop: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const handleAddMic = () => setDialog({ type: "addMic" });
  const handleAddElement = (kind: ElementKind) => setDialog({ type: "addElement", kind });
  const handleAddZone = () => setDialog({ type: "addZone" });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || centeredRef.current) return;
    centeredRef.current = true;
    viewport.scrollLeft = (CANVAS_HALF * zoom) - (viewport.clientWidth / 2);
    viewport.scrollTop = (CANVAS_HALF * zoom) - (viewport.clientHeight / 2);
  }, [zoom]);

  const getViewportCenterCoordinates = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return { x: 0, y: 0 };
    }
    const centerCanvasX = (viewport.scrollLeft + (viewport.clientWidth / 2)) / zoom;
    const centerCanvasY = (viewport.scrollTop + (viewport.clientHeight / 2)) / zoom;
    return {
      x: Math.round(centerCanvasX - CANVAS_HALF),
      y: Math.round(centerCanvasY - CANVAS_HALF),
    };
  }, [zoom]);

  const setZoomKeepingCenter = useCallback((nextZoomValue: number) => {
    const boundedZoom = clampZoom(nextZoomValue);
    if (boundedZoom === zoom) return;

    const viewport = viewportRef.current;
    if (!viewport) {
      setZoom(boundedZoom);
      return;
    }

    const centerCanvasX = (viewport.scrollLeft + (viewport.clientWidth / 2)) / zoom;
    const centerCanvasY = (viewport.scrollTop + (viewport.clientHeight / 2)) / zoom;

    setZoom(boundedZoom);
    requestAnimationFrame(() => {
      const nextViewport = viewportRef.current;
      if (!nextViewport) return;
      nextViewport.scrollLeft = (centerCanvasX * boundedZoom) - (nextViewport.clientWidth / 2);
      nextViewport.scrollTop = (centerCanvasY * boundedZoom) - (nextViewport.clientHeight / 2);
    });
  }, [zoom]);

  const handleZoomIn = useCallback(() => {
    setZoomKeepingCenter(zoom + ZOOM_STEP);
  }, [setZoomKeepingCenter, zoom]);

  const handleZoomOut = useCallback(() => {
    setZoomKeepingCenter(zoom - ZOOM_STEP);
  }, [setZoomKeepingCenter, zoom]);

  const handleViewportPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".stage-item, .zone-item, .resize-handle")) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    panRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
    };
    viewport.setPointerCapture(e.pointerId);
    setIsPanning(true);
  }, []);

  const handleViewportPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const pan = panRef.current;
    if (!pan.active || pan.pointerId !== e.pointerId || !viewport.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - pan.startX;
    const dy = e.clientY - pan.startY;
    viewport.scrollLeft = pan.startScrollLeft - dx;
    viewport.scrollTop = pan.startScrollTop - dy;
  }, []);

  const endViewportPan = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const pan = panRef.current;
    if (!pan.active || pan.pointerId !== e.pointerId) return;

    if (viewport.hasPointerCapture(e.pointerId)) {
      viewport.releasePointerCapture(e.pointerId);
    }

    panRef.current.active = false;
    setIsPanning(false);
  }, []);

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
      <StagePlanToolbar
        onAddMic={handleAddMic}
        onAddElement={handleAddElement}
        onAddZone={handleAddZone}
        zoomPercent={Math.round(zoom * 100)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      <div
        className={`stage-canvas-viewport ${isPanning ? "panning" : ""}`}
        ref={viewportRef}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={endViewportPan}
        onPointerCancel={endViewportPan}
      >
        <div
          className="stage-canvas-world"
          style={{
            width: CANVAS_SIZE * zoom,
            height: CANVAS_SIZE * zoom,
          }}
        >
          <div
            className="stage-canvas"
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              transform: `scale(${zoom})`,
            }}
          >
            <div className="stage-origin" style={{ left: CANVAS_HALF, top: CANVAS_HALF }} />

            {/* Layer 1: Zones (lowest) */}
            {zones.map(zone => (
              <ZoneItem
                key={String(zone.id)}
                zone={zone}
                scale={zoom}
                canvasOffset={CANVAS_HALF}
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
                scale={zoom}
                canvasOffset={CANVAS_HALF}
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
                scale={zoom}
                canvasOffset={CANVAS_HALF}
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
                scale={zoom}
                canvasOffset={CANVAS_HALF}
                onDragEnd={handleElementDragEnd}
                onTap={handleElementTap}
              />
            ))}
          </div>
        </div>
      </div>

      {dialog.type === "addMic" && (
        <MicDialog
          onSave={data => {
            const tempId = generateId();
            const center = getViewportCenterCoordinates();
            send({ type: "mic:create", tempId, data: { ...data, x: center.x, y: center.y } });
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
            const center = getViewportCenterCoordinates();
            const x = dialog.kind === "object" ? center.x - 100 : center.x;
            const y = dialog.kind === "object" ? center.y - 60 : center.y;
            send({ type: "element:create", tempId, data: { ...data, kind: dialog.kind, x, y } });
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
            const center = getViewportCenterCoordinates();
            send({ type: "zone:create", tempId, data: { ...data, x: center.x - 100, y: center.y - 75 } });
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
