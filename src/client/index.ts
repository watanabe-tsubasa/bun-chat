import { createRenderer, h, useEffect, useState } from "../runtime";
import type { ChatMessage } from "../db";
import { createInputHandlers } from "./input";

type PresenceEvent = { type: "presence"; count: number };
type ChatEvent = { type: "chat"; payload: ChatMessage };
type EventPayload = PresenceEvent | ChatEvent;

type Deps = {
  fetch?: typeof fetch;
  WebSocket?: typeof WebSocket;
  localStorage?: Storage;
};

function wsUrl(path = "/ws") {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}${path}`;
}

export function createApp(deps: Deps = {}) {
  const $fetch = deps.fetch ?? globalThis.fetch;
  const $WebSocket = deps.WebSocket ?? globalThis.WebSocket;
  const $localStorage = deps.localStorage ?? globalThis.localStorage;
  let wsRef: WebSocket | null = null;

  function HomeApp() {
    const [name, setName] = useState($localStorage?.getItem("chat_name") ?? "");
    const [count, setCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const nameHandlers = createInputHandlers(setName);

    useEffect(() => {
      const ws = new $WebSocket(wsUrl());
      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data) as EventPayload;
          if (data.type === "presence" && typeof data.count === "number") {
            setCount(data.count);
          }
        } catch {
          /* ignore */
        }
      });
      return () => ws.close();
    }, []);

    function submit(ev: Event) {
      ev.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        setError("Please enter a name");
        return;
      }
      $localStorage?.setItem("chat_name", trimmed);
      window.location.href = "/chat";
    }

    return h(
      "main",
      null,
      h("h1", null, "Bun Chat"),
      h(
        "form",
        { onSubmit: submit },
        h("label", null, "Name ", h("input", { "data-focus-key": "name", value: name, ...nameHandlers })),
        h("button", { type: "submit" }, "Enter chat"),
      ),
      h("p", null, `Connected: ${count ?? "-"}`),
      error ? h("p", { style: "color:red" }, error) : null,
    );
  }

  function MessageItem({ message, own }: { message: ChatMessage; own: boolean }) {
    const time = new Date(message.ts * 1000).toLocaleTimeString();
    const bubbleStyle = own
      ? "margin:6px 0; text-align:right;"
      : "margin:6px 0; text-align:left;";
    const msgStyle = own
      ? "display:inline-block; background:#d1e7ff; color:#0b3b75; padding:6px 10px; border-radius:12px 12px 0 12px;"
      : "display:inline-block; background:#f2f2f2; color:#222; padding:6px 10px; border-radius:12px 12px 12px 0;";
    return h(
      "li",
      { style: bubbleStyle },
      h("div", { style: msgStyle }, h("strong", null, message.name, ": "), message.message),
      h("div", { style: "font-size:12px; color:#666; margin-top:2px;" }, time),
    );
  }

  function ChatApp() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [username, setUsername] = useState($localStorage?.getItem("chat_name") ?? "");
    const msgHandlers = createInputHandlers(setInput);

    useEffect(() => {
      if (!username) {
        window.location.href = "/";
      }
    }, [username]);

    useEffect(() => {
      let active = true;
      (async () => {
        const res = await $fetch("/api/messages");
        if (!res.ok) return;
        const data = (await res.json()) as ChatMessage[];
        if (active) setMessages(data);
      })();
      return () => {
        active = false;
      };
    }, []);

    useEffect(() => {
      const ws = new $WebSocket(wsUrl());
      wsRef = ws;
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type: "join", name: username }));
      });
      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data) as EventPayload;
          if (data.type === "chat") {
            setMessages((prev) => [data.payload, ...prev].slice(0, 20));
          }
        } catch {
          /* ignore */
        }
      });
      return () => {
        if (wsRef === ws) wsRef = null;
        ws.close();
      };
    }, [username]);

    function submit(ev: Event) {
      ev.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || !username) return;
      const payload = { type: "chat", payload: { name: username, message: trimmed } };
      setInput("");
      if (wsRef && wsRef.readyState === WebSocket.OPEN) {
        wsRef.send(JSON.stringify(payload));
      } else {
        $fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: username, message: trimmed }),
        }).catch(() => {});
      }
    }

    return h(
      "main",
      null,
      h("h1", null, "Chat Room"),
      h(
        "ul",
        null,
        ...(messages.map((m) => MessageItem({ message: m, own: m.name === username })) ?? []),
      ),
      h(
        "form",
        { onSubmit: submit },
        h("input", {
        name: "message",
        "data-focus-key": "chat",
        autocomplete: "off",
        value: input,
        ...msgHandlers,
      }),
        h("button", { type: "submit" }, "Send"),
      ),
    );
  }

  function mount(root: Element | null = document.getElementById("app")) {
    if (!root) return;
    const page = (root as any).dataset?.page;
    const renderer =
      page === "chat" ? createRenderer(ChatApp, root) : createRenderer(HomeApp, root);
    renderer.render();
    return renderer;
  }

  return { mount, HomeApp, ChatApp };
}

const app = createApp();
app.mount();
