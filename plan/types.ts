export interface Mic {
  id: number | string;
  number: number;
  name: string;
  x: number;
  y: number;
}

export interface StageElement {
  id: number | string;
  kind: "speaker" | "monitor" | "stagebox" | "mixer" | "object";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface Zone {
  id: number | string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Column {
  id: number;
  key: string;
  label: string;
  type: "mic" | "text";
  sort_order: number;
  is_default: number;
}

export interface Song {
  id: number | string;
  title: string;
  artist: string;
  sort_order: number;
}

export interface Cell {
  song_id: number;
  column_id: number;
  value: string;
}

export interface NotificationPreset {
  id: number;
  label: string;
  emoji: string;
  color: string;
  sort_order: number;
}

export interface NotificationEvent {
  eventId: string;
  timestamp: number;
  notification: NotificationPreset;
}

export interface PlanState {
  mics: Map<number | string, Mic>;
  elements: Map<number | string, StageElement>;
  zones: Map<number | string, Zone>;
  columns: Column[];
  songs: Song[];
  cells: Map<string, Cell>;
  notificationPresets: NotificationPreset[];
  notificationEvent: NotificationEvent | null;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface PlanContextType {
  state: PlanState;
  status: ConnectionStatus;
  send: (msg: any) => void;
}

export const ZONE_COLORS = [
  { label: "Red", value: "#FF6B6B" },
  { label: "Blue", value: "#6B9FFF" },
  { label: "Green", value: "#6BCB77" },
  { label: "Yellow", value: "#FFE66D" },
  { label: "Purple", value: "#A78BFA" },
  { label: "Cyan", value: "#4ECDC4" },
  { label: "Orange", value: "#FF9F43" },
  { label: "Pink", value: "#FF6B9D" },
];

export const NOTIFICATION_COLORS = [
  { label: "Red", value: "#FF6B6B" },
  { label: "Blue", value: "#6B9FFF" },
  { label: "Green", value: "#6BCB77" },
  { label: "Yellow", value: "#FFE66D" },
  { label: "Purple", value: "#A78BFA" },
  { label: "Cyan", value: "#4ECDC4" },
  { label: "Orange", value: "#FF9F43" },
  { label: "Pink", value: "#FF6B9D" },
];

export function generateId(): string {
  const bytes = new Uint8Array(16);
  (globalThis.crypto ?? window.crypto).getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
