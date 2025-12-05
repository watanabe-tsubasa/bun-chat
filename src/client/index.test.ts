import { describe, expect, it } from "bun:test";
import { createApp } from "./index";
import { ElementNode, TestDocument } from "../tests/dom";
import type { ChatMessage } from "../db";

class FakeWebSocket extends EventTarget {
  readyState = 1;
  sent: string[] = [];
  constructor() {
    super();
    queueMicrotask(() => this.dispatchEvent(new Event("open")));
  }
  send(msg: string) {
    this.sent.push(msg);
  }
  close() {}
}

function setupDocument() {
  const doc = new TestDocument();
  // @ts-expect-error override for tests
  globalThis.document = doc;
  return doc;
}

describe("client ChatApp history rendering", () => {
  it("renders messages loaded from /api/messages", async () => {
    const doc = setupDocument();
    const root = new ElementNode("div", doc);
    root.dataset.page = "chat";
    doc.registerElement(root);

    const messages: ChatMessage[] = [
      { id: 1, name: "Alice", message: "Hi", ts: 1 },
      { id: 2, name: "Bob", message: "Yo", ts: 2 },
    ];

    const fakeFetch: typeof fetch = Object.assign(
      async (_input?: any, _init?: any) =>
        new Response(JSON.stringify(messages), { status: 200, headers: { "Content-Type": "application/json" } }),
      { preconnect: () => Promise.resolve() },
    );

    globalThis.WebSocket = FakeWebSocket as any;
    // localStorage stub
    const store: Record<string, string> = { chat_name: "Alice" };
    const localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;

    // minimal location mock
    // @ts-expect-error test-only location
    globalThis.location = { protocol: "http:", host: "localhost:3000" };

    const app = createApp({ fetch: fakeFetch, WebSocket: globalThis.WebSocket as any, localStorage });
    app.mount(root as any);

    await Promise.resolve();
    await Promise.resolve();

    expect(root.textContent.includes("Alice: Hi")).toBe(true);
    expect(root.textContent.includes("Bob: Yo")).toBe(true);
  });
});
