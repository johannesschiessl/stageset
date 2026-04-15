import type { ServerWebSocket } from "bun";
import clientHtml from "../client/index.html";
import { initializeDatabase } from "./db";
import { handleQuery, handleMutation } from "./handlers";
import type {
  WebSocketMessage,
  ResponseMessage,
  BroadcastMessage,
} from "../types";

initializeDatabase();

const clients = new Set<ServerWebSocket<unknown>>();

Bun.serve({
  port: "44100",
  routes: {
    "/": clientHtml,
  },

  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      console.log(`Client connected. Total clients: ${clients.size}`);
    },

    message(ws, message) {
      try {
        const msg = JSON.parse(message.toString()) as WebSocketMessage;

        if (msg.type === "query") {
          const result = handleQuery(msg.queryKey);
          const response: ResponseMessage = {
            type: "response",
            requestId: msg.requestId,
            ...("data" in result
              ? { data: result.data }
              : { error: result.error }),
          };
          ws.send(JSON.stringify(response));
        } else if (msg.type === "mutation") {
          const result = handleMutation(msg.mutationKey, msg.params);
          const response: ResponseMessage = {
            type: "response",
            requestId: msg.requestId,
            ...("data" in result
              ? { data: result.data }
              : { error: result.error }),
          };
          ws.send(JSON.stringify(response));

          // Broadcast to all clients
          if ("broadcasts" in result && result.broadcasts) {
            for (const broadcast of result.broadcasts) {
              broadcastToAll(broadcast);
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("WebSocket message error:", errorMessage);
        ws.send(
          JSON.stringify({
            type: "error",
            requestId: "unknown",
            message: errorMessage,
          }),
        );
      }
    },

    close(ws) {
      clients.delete(ws);
      console.log(`Client disconnected. Total clients: ${clients.size}`);
    },
  },

  development: {
    hmr: true,
    console: true,
  },
});

function broadcastToAll(broadcast: BroadcastMessage) {
  const message = JSON.stringify(broadcast);
  for (const client of clients) {
    client.send(message);
  }
}

console.log("Stageset server running on http://localhost:44100");
