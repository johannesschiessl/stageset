import { notifications, type Notification } from "./config";

// Track connected WebSocket clients
const clients = new Set<any>();

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
        "/api/notifications": () => {
            return Response.json(notifications);
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
                    // Find the notification config
                    const notification = notifications.find(n => n.id === data.id);
                    
                    if (notification) {
                        // Broadcast to all connected clients
                        const payload = JSON.stringify({
                            type: "notification",
                            notification,
                        });
                        
                        for (const client of clients) {
                            client.send(payload);
                        }
                        
                        console.log(`Broadcast notification: ${notification.label}`);
                    }
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
