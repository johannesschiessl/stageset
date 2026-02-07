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
  createNotificationPreset,
  updateNotificationPreset,
  deleteNotificationPreset,
  getNotificationPreset,
  listShows,
  selectShow,
  createShow,
  deleteShow,
  getCurrentShowName,
} from "./db";

const clients = new Set<any>();

function broadcastPlan(msg: any) {
  const payload = JSON.stringify(msg);
  for (const client of clients) {
    client.send(payload);
  }
}

function asInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return parsed;
}

function validateColor(value: string): string {
  const color = value.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new Error("Color must be a hex value like #12ABEF");
  }
  return color;
}

function parseNotificationPresetInput(data: any) {
  const label = String(data?.label ?? "").trim();
  const emoji = String(data?.emoji ?? "").trim();
  const color = validateColor(String(data?.color ?? "#6B9FFF"));

  if (!label) throw new Error("Label is required");
  if (!emoji) throw new Error("Emoji is required");

  return { label, emoji, color };
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
        result = updateMic(asInt(data.id, "mic id"), data.data);
        broadcastMsg = { scope: "plan", type: "mic:updated", data: result };
        break;
      }
      case "mic:delete": {
        const id = asInt(data.id, "mic id");
        deleteMic(id);
        broadcastMsg = { scope: "plan", type: "mic:deleted", id };
        break;
      }
      case "element:create": {
        result = createElement(data.data);
        broadcastMsg = { scope: "plan", type: "element:created", data: result, tempId: data.tempId };
        break;
      }
      case "element:update": {
        result = updateElement(asInt(data.id, "element id"), data.data);
        broadcastMsg = { scope: "plan", type: "element:updated", data: result };
        break;
      }
      case "element:delete": {
        const id = asInt(data.id, "element id");
        deleteElement(id);
        broadcastMsg = { scope: "plan", type: "element:deleted", id };
        break;
      }
      case "column:create": {
        result = createColumn(data.data);
        broadcastMsg = { scope: "plan", type: "column:created", data: result, tempId: data.tempId };
        break;
      }
      case "column:update": {
        result = updateColumn(asInt(data.id, "column id"), data.data);
        broadcastMsg = { scope: "plan", type: "column:updated", data: result };
        break;
      }
      case "column:delete": {
        const id = asInt(data.id, "column id");
        deleteColumn(id);
        broadcastMsg = { scope: "plan", type: "column:deleted", id };
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
        result = updateSong(asInt(data.id, "song id"), data.data);
        broadcastMsg = { scope: "plan", type: "song:updated", data: result };
        break;
      }
      case "song:delete": {
        const id = asInt(data.id, "song id");
        deleteSong(id);
        broadcastMsg = { scope: "plan", type: "song:deleted", id };
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
        result = updateZone(asInt(data.id, "zone id"), data.data);
        broadcastMsg = { scope: "plan", type: "zone:updated", data: result };
        break;
      }
      case "zone:delete": {
        const id = asInt(data.id, "zone id");
        deleteZone(id);
        broadcastMsg = { scope: "plan", type: "zone:deleted", id };
        break;
      }
      case "cell:update": {
        const songId = asInt(data.songId, "song id");
        const columnId = asInt(data.columnId, "column id");
        result = upsertCell(songId, columnId, String(data.value ?? ""));
        broadcastMsg = { scope: "plan", type: "cell:updated", data: result };
        break;
      }
      case "notificationPreset:create": {
        result = createNotificationPreset(parseNotificationPresetInput(data.data));
        broadcastMsg = { scope: "plan", type: "notificationPreset:created", data: result };
        break;
      }
      case "notificationPreset:update": {
        const id = asInt(data.id, "notification preset id");
        result = updateNotificationPreset(id, parseNotificationPresetInput(data.data));
        broadcastMsg = { scope: "plan", type: "notificationPreset:updated", data: result };
        break;
      }
      case "notificationPreset:delete": {
        const id = asInt(data.id, "notification preset id");
        deleteNotificationPreset(id);
        broadcastMsg = { scope: "plan", type: "notificationPreset:deleted", id };
        break;
      }
      case "notification:trigger": {
        const id = asInt(data.id, "notification preset id");
        const notification = getNotificationPreset(id);
        if (!notification) throw new Error(`Notification preset ${id} not found`);
        broadcastMsg = {
          scope: "plan",
          type: "notification:triggered",
          eventId: crypto.randomUUID(),
          timestamp: Date.now(),
          notification,
        };
        break;
      }
      default:
        sender.send(JSON.stringify({ scope: "plan", type: "error", message: `Unknown type: ${data.type}` }));
        return;
    }

    broadcastPlan(broadcastMsg);
  } catch (err: any) {
    sender.send(
      JSON.stringify({
        scope: "plan",
        type: "error",
        tempId: data.tempId,
        message: err.message ?? String(err),
      }),
    );
  }
}

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  development: true,
  routes: {
    "/": planPage,
    "/plan": (req: Request) => {
      return Response.redirect(new URL("/", req.url), 302);
    },
    "/api/plan/state": () => {
      const current = getCurrentShowName();
      if (!current) {
        return Response.json({ error: "No show selected" }, { status: 400 });
      }
      return Response.json({ ...getFullState(), currentShow: current });
    },
    "/api/shows": async (req: Request) => {
      if (req.method === "GET") {
        return Response.json({ shows: listShows(), currentShow: getCurrentShowName() });
      }
      if (req.method === "POST") {
        try {
          const body = await req.json();
          const name = String(body?.name ?? "").trim();
          if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
          createShow(name);
          return Response.json({ ok: true, name });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 400 });
        }
      }
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    },
    "/api/shows/select": async (req: Request) => {
      if (req.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
      }
      try {
        const body = await req.json();
        const name = String(body?.name ?? "").trim();
        if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
        selectShow(name);
        const state = getFullState();
        broadcastPlan({
          scope: "plan",
          type: "show:changed",
          show: name,
          state,
        });
        return Response.json({ ok: true, name });
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    },
  },
  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) {
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // DELETE /api/shows/:name
    if (url.pathname.startsWith("/api/shows/") && req.method === "DELETE") {
      const name = decodeURIComponent(url.pathname.slice("/api/shows/".length));
      try {
        deleteShow(name);
        return Response.json({ ok: true });
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 400 });
      }
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
        if (data.scope === "plan") {
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
