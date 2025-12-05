import type { ServerWebSocket } from "bun";
import { fetchLatestMessages, insertMessage } from "./src/db";
import { renderShell } from "./src/server/shell";
import { broadcastChat, broadcastPresence } from "./src/ws";

type WsData = { name?: string };
type WsClient = ServerWebSocket<WsData>;

const PORT = Number(process.env.PORT ?? 3000);
const clients = new Set<WsClient>();
const MAX_CLIENTS = Number(process.env.MAX_CLIENTS ?? 50);

const htmlHeaders = { "Content-Type": "text/html; charset=utf-8" };
const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
const allowedOriginsEnv = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isOriginAllowed(origin: string | null, requestUrl: URL, hostHeader?: string | null) {
  const allowlist = allowedOriginsEnv;
  if (allowlist.length === 0) {
    // Default: allow when no allowlist configured
    return true;
  }
  const requestOrigin = hostHeader ? `${requestUrl.protocol}//${hostHeader}` : requestUrl.origin;
  // Same-origin always allowed
  if (origin === requestOrigin || origin === requestUrl.origin) return true;
  // No Origin header: allow if host-derived origin is in allowlist
  if (!origin) return allowlist.includes(requestOrigin);
  // Otherwise require explicit allowlist match
  return allowlist.includes(origin);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

async function serveStatic(url: URL) {
  const relPath = url.pathname.replace(/^\/static\//, "");
  if (relPath.includes("..")) {
    return new Response("Not Found", { status: 404 });
  }
  const file = Bun.file(`./static/${relPath}`);
  if (await file.exists()) {
    return new Response(file);
  }
  return new Response("Not Found", { status: 404 });
}

function sanitizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 500);
}

export async function handleApiMessages(req: Request) {
  if (req.method === "GET") {
    const messages = fetchLatestMessages();
    return json(messages);
  }
  if (req.method === "POST") {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > 2048) {
      return new Response("Payload too large", { status: 413 });
    }
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const name = sanitizeText(body?.name);
    const message = sanitizeText(body?.message);
    if (!name || !message) {
      return json({ error: "Missing name or message" }, 400);
    }
    const ts = Math.floor(Date.now() / 1000);
    insertMessage({ name, message, ts });
    broadcastChat(clients, { name, message, ts });
    return json({ ok: true, ts });
  }
  return new Response("Method Not Allowed", { status: 405 });
}

Bun.serve<WsData>({
  port: PORT,
  fetch: async (req, server) => {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      if (clients.size >= MAX_CLIENTS) {
        return new Response("Service Unavailable", { status: 503 });
      }
      const origin = req.headers.get("origin");
      const hostHeader = req.headers.get("host");
      if (!isOriginAllowed(origin, url, hostHeader)) {
        return new Response("Forbidden", { status: 403 });
      }
      const upgraded = server.upgrade(req, { data: { name: undefined } });
      if (upgraded) return undefined;
      return new Response("Expected WebSocket", { status: 426 });
    }

    if (url.pathname === "/") {
      return new Response(renderShell("home"), { headers: htmlHeaders });
    }

    if (url.pathname === "/chat") {
      return new Response(renderShell("chat"), { headers: htmlHeaders });
    }

    if (url.pathname === "/api/messages") {
      const origin = req.headers.get("origin");
      const hostHeader = req.headers.get("host");
      if (!isOriginAllowed(origin, url, hostHeader)) {
        return new Response("Forbidden", { status: 403 });
      }
      return handleApiMessages(req);
    }

    if (url.pathname.startsWith("/static/")) {
      return serveStatic(url);
    }

    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws: WsClient) {
      clients.add(ws);
      broadcastPresence(clients);
    },
    close(ws: WsClient) {
      clients.delete(ws);
      broadcastPresence(clients);
    },
    message(ws: WsClient, raw) {
      let parsed: any;
      try {
        parsed = typeof raw === "string" ? JSON.parse(raw) : JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (parsed?.type === "join") {
        const name = sanitizeText(parsed?.name);
        if (name) {
          ws.data.name = name;
          broadcastPresence(clients);
        }
        return;
      }
      if (parsed?.type === "chat") {
        const name = sanitizeText(parsed?.payload?.name ?? ws.data.name);
        const message = sanitizeText(parsed?.payload?.message);
        if (!name || !message) return;
        const ts = Math.floor(Date.now() / 1000);
        insertMessage({ name, message, ts });
        broadcastChat(clients, { name, message, ts });
      }
    },
  },
});

console.log(`Server running on http://localhost:${PORT}`);
