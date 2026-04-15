// Shared types between client and server

export interface Microphone {
  id: string;
  number: number;
  name: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  microphones: string[];
  monitor: string[];
  notes: string;
}

// WebSocket Message Types

export type WebSocketMessage =
  | QueryMessage
  | MutationMessage
  | ResponseMessage
  | BroadcastMessage
  | ErrorMessage;

export interface QueryMessage {
  type: "query";
  requestId: string;
  queryKey: string;
}

export interface MutationMessage {
  type: "mutation";
  requestId: string;
  mutationKey: string;
  params: unknown;
}

export interface ResponseMessage {
  type: "response";
  requestId: string;
  data?: unknown;
  error?: string;
}

export interface BroadcastMessage {
  type: "broadcast";
  key: string;
  data: unknown;
}

export interface ErrorMessage {
  type: "error";
  requestId: string;
  message: string;
}
