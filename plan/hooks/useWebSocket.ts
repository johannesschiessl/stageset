import { useReducer, useRef, useCallback, useEffect } from "react";
import type {
  PlanState,
  Mic,
  StageElement,
  Zone,
  Column,
  Song,
  Cell,
  ConnectionStatus,
  NotificationPreset,
  NotificationEvent,
} from "../types";

type Action =
  | { type: "SET_FULL_STATE"; data: any }
  | { type: "SET_STATUS"; status: ConnectionStatus }
  | { type: "mic:created"; data: Mic; tempId?: string }
  | { type: "mic:updated"; data: Mic }
  | { type: "mic:deleted"; id: number }
  | { type: "element:created"; data: StageElement; tempId?: string }
  | { type: "element:updated"; data: StageElement }
  | { type: "element:deleted"; id: number }
  | { type: "zone:created"; data: Zone; tempId?: string }
  | { type: "zone:updated"; data: Zone }
  | { type: "zone:deleted"; id: number }
  | { type: "column:created"; data: Column; tempId?: string }
  | { type: "column:updated"; data: Column }
  | { type: "column:deleted"; id: number }
  | { type: "columns:reordered"; order: number[] }
  | { type: "song:created"; data: Song; tempId?: string }
  | { type: "song:updated"; data: Song }
  | { type: "song:deleted"; id: number }
  | { type: "songs:reordered"; order: number[] }
  | { type: "cell:updated"; data: Cell }
  | { type: "notificationPreset:created"; data: NotificationPreset }
  | { type: "notificationPreset:updated"; data: NotificationPreset }
  | { type: "notificationPreset:deleted"; id: number }
  | { type: "notification:triggered"; eventId: string; timestamp: number; notification: NotificationPreset }
  | { type: "OPTIMISTIC_MIC"; data: Mic }
  | { type: "OPTIMISTIC_ELEMENT"; data: StageElement }
  | { type: "OPTIMISTIC_ZONE"; data: Zone }
  | { type: "OPTIMISTIC_SONG"; data: Song }
  | { type: "OPTIMISTIC_COLUMN"; data: Column };

interface State {
  plan: PlanState;
  status: ConnectionStatus;
}

const initialState: State = {
  plan: {
    mics: new Map(),
    elements: new Map(),
    zones: new Map(),
    columns: [],
    songs: [],
    cells: new Map(),
    notificationPresets: [],
    notificationEvent: null,
  },
  status: "connecting",
};

function reducer(state: State, action: Action): State {
  const plan = state.plan;

  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.status };

    case "SET_FULL_STATE": {
      const d = action.data;
      const mics = new Map<number | string, Mic>();
      for (const m of d.mics) mics.set(m.id, m);
      const elements = new Map<number | string, StageElement>();
      for (const e of d.stageElements) elements.set(e.id, e);
      const zones = new Map<number | string, Zone>();
      for (const z of (d.zones ?? [])) zones.set(z.id, z);
      const cells = new Map<string, Cell>();
      for (const c of d.cells) cells.set(`${c.song_id}:${c.column_id}`, c);
      return {
        ...state,
        plan: {
          mics,
          elements,
          zones,
          columns: d.columns,
          songs: d.songs,
          cells,
          notificationPresets: d.notificationPresets ?? [],
          notificationEvent: null,
        },
      };
    }

    case "OPTIMISTIC_MIC": {
      const mics = new Map(plan.mics);
      mics.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, mics } };
    }
    case "mic:created": {
      const mics = new Map(plan.mics);
      if (action.tempId) mics.delete(action.tempId);
      mics.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, mics } };
    }
    case "mic:updated": {
      const mics = new Map(plan.mics);
      mics.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, mics } };
    }
    case "mic:deleted": {
      const mics = new Map(plan.mics);
      mics.delete(action.id);
      return { ...state, plan: { ...plan, mics } };
    }

    case "OPTIMISTIC_ELEMENT": {
      const elements = new Map(plan.elements);
      elements.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, elements } };
    }
    case "element:created": {
      const elements = new Map(plan.elements);
      if (action.tempId) elements.delete(action.tempId);
      elements.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, elements } };
    }
    case "element:updated": {
      const elements = new Map(plan.elements);
      elements.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, elements } };
    }
    case "element:deleted": {
      const elements = new Map(plan.elements);
      elements.delete(action.id);
      return { ...state, plan: { ...plan, elements } };
    }

    case "OPTIMISTIC_ZONE": {
      const zones = new Map(plan.zones);
      zones.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, zones } };
    }
    case "zone:created": {
      const zones = new Map(plan.zones);
      if (action.tempId) zones.delete(action.tempId);
      zones.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, zones } };
    }
    case "zone:updated": {
      const zones = new Map(plan.zones);
      zones.set(action.data.id, action.data);
      return { ...state, plan: { ...plan, zones } };
    }
    case "zone:deleted": {
      const zones = new Map(plan.zones);
      zones.delete(action.id);
      return { ...state, plan: { ...plan, zones } };
    }

    case "OPTIMISTIC_COLUMN": {
      return { ...state, plan: { ...plan, columns: [...plan.columns, action.data as Column] } };
    }
    case "column:created": {
      const columns = plan.columns.filter(c => c.key !== action.tempId);
      columns.push(action.data);
      columns.sort((a, b) => a.sort_order - b.sort_order);
      return { ...state, plan: { ...plan, columns } };
    }
    case "column:updated": {
      const columns = plan.columns.map(c => c.id === action.data.id ? action.data : c);
      return { ...state, plan: { ...plan, columns } };
    }
    case "column:deleted": {
      const columns = plan.columns.filter(c => c.id !== action.id);
      // Also remove cells for this column
      const cells = new Map(plan.cells);
      for (const [key, cell] of cells) {
        if (cell.column_id === action.id) cells.delete(key);
      }
      return { ...state, plan: { ...plan, columns, cells } };
    }
    case "columns:reordered": {
      const order = action.order;
      const columns = plan.columns.slice().sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        return ai - bi;
      });
      columns.forEach((c, i) => c.sort_order = i);
      return { ...state, plan: { ...plan, columns } };
    }

    case "OPTIMISTIC_SONG": {
      return { ...state, plan: { ...plan, songs: [...plan.songs, action.data as Song] } };
    }
    case "song:created": {
      const songs = plan.songs.filter(s => s.id !== action.tempId);
      songs.push(action.data);
      songs.sort((a, b) => a.sort_order - b.sort_order);
      return { ...state, plan: { ...plan, songs } };
    }
    case "song:updated": {
      const songs = plan.songs.map(s => s.id === action.data.id ? { ...s, ...action.data } : s);
      return { ...state, plan: { ...plan, songs } };
    }
    case "song:deleted": {
      const songs = plan.songs.filter(s => s.id !== action.id);
      // Also remove cells for this song
      const cells = new Map(plan.cells);
      for (const [key, cell] of cells) {
        if (cell.song_id === action.id) cells.delete(key);
      }
      return { ...state, plan: { ...plan, songs, cells } };
    }
    case "songs:reordered": {
      const order = action.order;
      const songs = plan.songs.slice().sort((a, b) => {
        const ai = order.indexOf(a.id as number);
        const bi = order.indexOf(b.id as number);
        return ai - bi;
      });
      songs.forEach((s, i) => s.sort_order = i);
      return { ...state, plan: { ...plan, songs } };
    }

    case "cell:updated": {
      const cells = new Map(plan.cells);
      const key = `${action.data.song_id}:${action.data.column_id}`;
      cells.set(key, action.data);
      return { ...state, plan: { ...plan, cells } };
    }

    case "notificationPreset:created": {
      const notificationPresets = [...plan.notificationPresets, action.data].sort((a, b) => a.sort_order - b.sort_order);
      return { ...state, plan: { ...plan, notificationPresets } };
    }

    case "notificationPreset:updated": {
      const notificationPresets = plan.notificationPresets
        .map((preset) => (preset.id === action.data.id ? action.data : preset))
        .sort((a, b) => a.sort_order - b.sort_order);
      return { ...state, plan: { ...plan, notificationPresets } };
    }

    case "notificationPreset:deleted": {
      const notificationPresets = plan.notificationPresets.filter((preset) => preset.id !== action.id);
      return { ...state, plan: { ...plan, notificationPresets } };
    }

    case "notification:triggered": {
      const notificationEvent: NotificationEvent = {
        eventId: action.eventId,
        timestamp: action.timestamp,
        notification: action.notification,
      };
      return { ...state, plan: { ...plan, notificationEvent } };
    }

    default:
      return state;
  }
}

export function usePlanWebSocket() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<any[]>([]);
  const retryRef = useRef(1000);

  const send = useCallback((msg: any) => {
    const tagged = { ...msg, scope: "plan" };
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(tagged));
    } else {
      queueRef.current.push(tagged);
    }
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/plan/state");
      const data = await res.json();
      dispatch({ type: "SET_FULL_STATE", data });
    } catch (e) {
      console.error("Failed to fetch plan state:", e);
    }
  }, []);

  const connect = useCallback(() => {
    dispatch({ type: "SET_STATUS", status: "connecting" });
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch({ type: "SET_STATUS", status: "connected" });
      retryRef.current = 1000;
      fetchState();
      // Flush queue
      const queue = queueRef.current;
      queueRef.current = [];
      for (const msg of queue) {
        ws.send(JSON.stringify(msg));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.scope === "plan" && data.type !== "error") {
          dispatch(data as Action);
        } else if (data.scope === "plan" && data.type === "error") {
          console.error("Plan error:", data.message);
        }
      } catch (e) {
        // ignore non-plan messages
      }
    };

    ws.onclose = () => {
      dispatch({ type: "SET_STATUS", status: "disconnected" });
      const delay = Math.min(retryRef.current, 10000);
      retryRef.current = delay * 2;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [fetchState]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { state: state.plan, status: state.status, send, dispatch };
}
