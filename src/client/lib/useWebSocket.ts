import { useEffect, useRef, useState, useCallback } from "react";
import type { WebSocketMessage } from "../../types";

export type QueryKey = "microphones" | "songs";
export type MutationKey =
  | "addMicrophone"
  | "updateMicrophone"
  | "removeMicrophone"
  | "addSong"
  | "updateSong"
  | "removeSong"
  | "moveSong"
  | "toggleMicrophone";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: string) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// --- Module-level singletons ---

let ws: WebSocket | null = null;
let connectingPromise: Promise<WebSocket> | null = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const pendingRequests = new Map<string, PendingRequest>();
const broadcastListeners = new Map<string, Set<(data: unknown) => void>>();
const connectionListeners = new Set<(connected: boolean) => void>();

// Tracks active query subscriptions so we can re-fetch on reconnect
const activeQueries = new Map<
  string,
  { queryKey: QueryKey; setData: (data: unknown) => void }
>();

function notifyConnectionListeners(connected: boolean) {
  for (const listener of connectionListeners) {
    listener(connected);
  }
}

function handleMessage(event: MessageEvent) {
  try {
    const msg = JSON.parse(event.data) as WebSocketMessage;

    if (msg.type === "response") {
      const pending = pendingRequests.get(msg.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingRequests.delete(msg.requestId);
        if (msg.error) {
          pending.reject(msg.error);
        } else {
          pending.resolve(msg.data);
        }
      }
    } else if (msg.type === "broadcast") {
      const listeners = broadcastListeners.get(msg.key);
      if (listeners) {
        for (const callback of listeners) {
          callback(msg.data);
        }
      }
    } else if (msg.type === "error") {
      console.error("WebSocket error:", msg);
    }
  } catch (err) {
    console.error("Failed to parse WebSocket message:", err);
  }
}

function sendQuery(socket: WebSocket, queryKey: QueryKey): Promise<unknown> {
  const requestId = `query-${queryKey}-${Date.now()}-${Math.random()}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Request timeout"));
    }, 5000);

    pendingRequests.set(requestId, {
      resolve,
      reject,
      timeout,
    });

    socket.send(JSON.stringify({ type: "query", requestId, queryKey }));
  });
}

function refetchActiveQueries(socket: WebSocket) {
  for (const [, { queryKey, setData }] of activeQueries) {
    sendQuery(socket, queryKey)
      .then((data) => setData(data))
      .catch((err) => console.error(`Failed to refetch ${queryKey}:`, err));
  }
}

function createWebSocket(): Promise<WebSocket> {
  connectingPromise = new Promise<WebSocket>((resolve, reject) => {
    const socket = new WebSocket(`ws://${window.location.host}/ws`);

    socket.onopen = () => {
      ws = socket;
      connectingPromise = null;
      reconnectAttempt = 0;
      notifyConnectionListeners(true);
      refetchActiveQueries(socket);
      resolve(socket);
    };

    socket.onmessage = handleMessage;

    socket.onerror = () => {
      // onerror is always followed by onclose, so let onclose handle reconnect
    };

    socket.onclose = () => {
      ws = null;
      connectingPromise = null;
      notifyConnectionListeners(false);

      // Reject all pending requests
      for (const [id, pending] of pendingRequests) {
        clearTimeout(pending.timeout);
        pending.reject("WebSocket connection closed");
        pendingRequests.delete(id);
      }

      // Auto-reconnect with exponential backoff: 1s, 2s, 4s, max 10s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 10000);
      reconnectAttempt++;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        ensureWebSocket().catch(() => {
          // Reconnect failed, onclose will schedule another attempt
        });
      }, delay);
    };
  });

  connectingPromise.catch(() => {
    connectingPromise = null;
  });

  return connectingPromise;
}

function ensureWebSocket(): Promise<WebSocket> {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return Promise.resolve(ws);
  }
  if (connectingPromise) {
    return connectingPromise;
  }
  return createWebSocket();
}

function addBroadcastListener(
  key: string,
  callback: (data: unknown) => void,
): () => void {
  if (!broadcastListeners.has(key)) {
    broadcastListeners.set(key, new Set());
  }
  broadcastListeners.get(key)!.add(callback);

  return () => {
    const listeners = broadcastListeners.get(key);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        broadcastListeners.delete(key);
      }
    }
  };
}

// --- Hooks ---

export function useWebSocketConnection() {
  const [connected, setConnected] = useState(
    () => ws !== null && ws.readyState === WebSocket.OPEN,
  );

  useEffect(() => {
    // Subscribe to connection state changes
    connectionListeners.add(setConnected);

    // Ensure a connection exists
    ensureWebSocket().catch(() => {});

    return () => {
      connectionListeners.delete(setConnected);
    };
  }, []);

  return connected;
}

export function useQuery<T>(
  queryKey: QueryKey,
  initialData?: T,
): { data: T | undefined; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const subscriptionId = useRef(`${queryKey}-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    const id = subscriptionId.current;

    // Register for broadcast updates
    const setDataTyped = (newData: unknown) => setData(newData as T);
    unsubscribeRef.current = addBroadcastListener(queryKey, setDataTyped);

    // Track this query for reconnect refetching
    activeQueries.set(id, { queryKey, setData: setDataTyped });

    // Fetch initial data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const socket = await ensureWebSocket();
        const result = await sendQuery(socket, queryKey);
        setData(result as T);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      activeQueries.delete(id);
    };
  }, [queryKey]);

  return { data, loading, error };
}

export function useMutation<TInput, TOutput>(mutationKey: MutationKey) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (params?: TInput): Promise<TOutput | undefined> => {
      try {
        setLoading(true);
        setError(null);
        const socket = await ensureWebSocket();

        const requestId = `mutation-${mutationKey}-${Date.now()}-${Math.random()}`;

        const result = await new Promise<TOutput>((resolve, reject) => {
          const timeout = setTimeout(() => {
            pendingRequests.delete(requestId);
            reject(new Error("Request timeout"));
          }, 5000);

          pendingRequests.set(requestId, {
            resolve: (value) => resolve(value as TOutput),
            reject,
            timeout,
          });

          socket.send(
            JSON.stringify({
              type: "mutation",
              requestId,
              mutationKey,
              params,
            }),
          );
        });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationKey],
  );

  return { mutate, loading, error };
}
