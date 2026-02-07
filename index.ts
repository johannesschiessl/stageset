import { notifications, type Notification } from "./config";
import planPage from "./plan/plan.html";
import {
  getFullState,
  createMic,
  updateMic,
  deleteMic,
  createElement,
  updateElement,
  deleteElement,
  createZone,
  updateZone,
  deleteZone,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
  createSong,
  updateSong,
  deleteSong,
  reorderSongs,
  upsertCell,
} from "./db";

// Track connected WebSocket clients
const clients = new Set<any>();

function broadcastPlan(msg: any) {
  const payload = JSON.stringify(msg);
  for (const client of clients) {
    client.send(payload);
  }
}

function handlePlanMessage(data: any, sender: any) {
  try {
    let result: any;
    let broadcastMsg: any;

    switch (data.type) {
      case "mic:create": {
        result = createMic(data.data);
        broadcastMsg = { scope: "plan", type: "mic:created", data: result, tempId: data.tempId };
        break;
      }
      case "mic:update": {
        result = updateMic(data.id, data.data);
        broadcastMsg = { scope: "plan", type: "mic:updated", data: result };
        break;
      }
      case "mic:delete": {
        deleteMic(data.id);
        broadcastMsg = { scope: "plan", type: "mic:deleted", id: data.id };
        break;
      }
      case "element:create": {
        result = createElement(data.data);
        broadcastMsg = { scope: "plan", type: "element:created", data: result, tempId: data.tempId };
        break;
      }
      case "element:update": {
        result = updateElement(data.id, data.data);
        broadcastMsg = { scope: "plan", type: "element:updated", data: result };
        break;
      }
      case "element:delete": {
        deleteElement(data.id);
        broadcastMsg = { scope: "plan", type: "element:deleted", id: data.id };
        break;
      }
      case "column:create": {
        result = createColumn(data.data);
        broadcastMsg = { scope: "plan", type: "column:created", data: result, tempId: data.tempId };
        break;
      }
      case "column:update": {
        result = updateColumn(data.id, data.data);
        broadcastMsg = { scope: "plan", type: "column:updated", data: result };
        break;
      }
      case "column:delete": {
        deleteColumn(data.id);
        broadcastMsg = { scope: "plan", type: "column:deleted", id: data.id };
        break;
      }
      case "columns:reorder": {
        reorderColumns(data.order);
        broadcastMsg = { scope: "plan", type: "columns:reordered", order: data.order };
        break;
      }
      case "song:create": {
        result = createSong(data.data);
        broadcastMsg = { scope: "plan", type: "song:created", data: result, tempId: data.tempId };
        break;
      }
      case "song:update": {
        result = updateSong(data.id, data.data);
        broadcastMsg = { scope: "plan", type: "song:updated", data: result };
        break;
      }
      case "song:delete": {
        deleteSong(data.id);
        broadcastMsg = { scope: "plan", type: "song:deleted", id: data.id };
        break;
      }
      case "songs:reorder": {
        reorderSongs(data.order);
        broadcastMsg = { scope: "plan", type: "songs:reordered", order: data.order };
        break;
      }
      case "zone:create": {
        result = createZone(data.data);
        broadcastMsg = { scope: "plan", type: "zone:created", data: result, tempId: data.tempId };
        break;
      }
      case "zone:update": {
        result = updateZone(data.id, data.data);
        broadcastMsg = { scope: "plan", type: "zone:updated", data: result };
        break;
      }
      case "zone:delete": {
        deleteZone(data.id);
        broadcastMsg = { scope: "plan", type: "zone:deleted", id: data.id };
        break;
      }
      case "cell:update": {
        result = upsertCell(data.songId, data.columnId, data.value);
        broadcastMsg = { scope: "plan", type: "cell:updated", data: result };
        break;
      }
      default:
        sender.send(JSON.stringify({ scope: "plan", type: "error", message: `Unknown type: ${data.type}` }));
        return;
    }

    broadcastPlan(broadcastMsg);
  } catch (err: any) {
    sender.send(JSON.stringify({
      scope: "plan",
      type: "error",
      tempId: data.tempId,
      message: err.message ?? String(err),
    }));
  }
}

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0", // Listen on all interfaces for local network access
  development: true,
  routes: {
    "/": async () => {
      const file = Bun.file("./public/index.html");
      return new Response(file, {
        headers: { "Content-Type": "text/html" },
      });
    },
    "/plan": planPage,
    "/api/notifications": () => {
      return Response.json(notifications);
    },
    "/api/plan/state": () => {
      return Response.json(getFullState());
    },
  },
  fetch(req, server) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) {
        return undefined;
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
        const data = JSON.parse(message.toString());

        if (data.type === "notification") {
          // existing notification handling — unchanged
          const notification = notifications.find((n) => n.id === data.id);

          if (notification) {
            const payload = JSON.stringify({
              type: "notification",
              notification,
            });

            for (const client of clients) {
              client.send(payload);
            }

            console.log(`Broadcast notification: ${notification.label}`);
          }
        } else if (data.scope === "plan") {
          handlePlanMessage(data, ws);
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    },
    close(ws) {
      clients.delete(ws);
      console.log(`Client disconnected. Total clients: ${clients.size}`);
    },
  },
});

console.log(`Stageset server running on ${server.url}`);
console.log(`WebSocket available at ws://${server.hostname}:${server.port}/ws`);
