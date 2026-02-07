export interface Mic {
  id: number | string;
  number: number;
  name: string;
  x: number;
  y: number;
}

export interface StageElement {
  id: number | string;
  kind: "speaker" | "monitor" | "di_box" | "custom";
  label: string;
  x: number;
  y: number;
  rotation: number;
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

export interface PlanState {
  mics: Map<number | string, Mic>;
  elements: Map<number | string, StageElement>;
  columns: Column[];
  songs: Song[];
  cells: Map<string, Cell>;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface PlanContextType {
  state: PlanState;
  status: ConnectionStatus;
  send: (msg: any) => void;
}

export function generateId(): string {
  const bytes = new Uint8Array(16);
  (globalThis.crypto ?? window.crypto).getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
