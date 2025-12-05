import { describe, expect, it } from "bun:test";
import { broadcast, broadcastChat, broadcastPresence } from "./ws";
import type { WsClientLike } from "./ws";

function makeClient() {
  const messages: string[] = [];
  const client: WsClientLike = {
    send(msg) {
      messages.push(typeof msg === "string" ? msg : msg.toString());
    },
  };
  return { client, messages };
}

describe("ws broadcast helpers", () => {
  it("sends serialized payload to all clients", () => {
    const a = makeClient();
    const b = makeClient();
    const clients = new Set<WsClientLike>([a.client, b.client]);
    const count = broadcast(clients, { type: "ping", val: 1 });
    expect(count).toBe(2);
    expect(a.messages[0]).toBe('{"type":"ping","val":1}');
    expect(b.messages[0]).toBe('{"type":"ping","val":1}');
  });

  it("broadcasts presence with current count", () => {
    const a = makeClient();
    const b = makeClient();
    const clients = new Set<WsClientLike>([a.client, b.client]);
    broadcastPresence(clients);
    expect(a.messages[0]).toBe('{"type":"presence","count":2}');
  });

  it("broadcasts chat payload", () => {
    const a = makeClient();
    const clients = new Set<WsClientLike>([a.client]);
    broadcastChat(clients, { name: "alice", message: "hi", ts: 1 });
    expect(a.messages[0]).toBe('{"type":"chat","payload":{"name":"alice","message":"hi","ts":1}}');
  });
});
