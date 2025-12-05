import { useEffect, useState } from "src/runtime";
import { createInputHandlers } from "../input";
import type { ChatMessage, EventPayload } from "src/types";
import { MessageItem } from "src/components/MessageItem";

interface ChatAppProps {
  $localStorage: Storage;
  $fetch: typeof fetch;
  $WebSocket: {
    new (url: string | URL, protocols?: string | string[] | undefined): WebSocket;
    prototype: WebSocket;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
  };
  wsUrl: (path?: string) => string;
  wsRef: { current: WebSocket | null };
}

export default function ChatApp({
  $localStorage,
  $fetch,
  $WebSocket,
  wsUrl,
  wsRef
}: ChatAppProps) {
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
    wsRef.current = ws;
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "join", name: username }));
    });
    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as EventPayload;
        if (data.type === "chat") {
          setMessages((prev) => [data.payload, ...prev].slice(0, 20));
        }
        if (data.type === "error" && data.reason === "name_taken") {
          alert("同じ名前の人がいますので、名前を変更してください。");
          $localStorage.removeItem("chat_name");
          window.location.href = "/";
        }
      } catch {
        /* ignore */
      }
    });
    return () => {
      if (wsRef.current === ws) wsRef.current = null;
      ws.close();
    };
  }, [username]);

  function submit(ev: Event) {
    ev.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !username) return;
    const payload = { type: "chat", payload: { name: username, message: trimmed } };
    setInput("");
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      $fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, message: trimmed }),
      }).catch(() => {});
    }
  }

  return (
    <main className="chat-shell">
      <header className="chat-header">
        <h1 className="chat-header-title">Chat Room</h1>
        <div style="display:flex; align-items:center; justify-content: space-between; gap: 12px;">
          <p className="muted" style="margin:4px 0 0;">Signed in as {username || "guest"}</p>
          <button
            className="button chat-exit"
            type="button"
            onClick={() => {
              $localStorage.removeItem("chat_name");
              wsRef.current?.close();
              window.location.href = "/";
            }}
          >
            Exit
          </button>
        </div>
      </header>
      <section className="chat-body">
        <ul className="chat-list">
          {messages.map((m) => (
            <MessageItem message={m} own={m.name === username} />
          ))}
        </ul>
      </section>
      <div className="chat-composer">
        <form className="composer-form" onSubmit={submit}>
          <input
            className="input composer-input"
            name="message"
            data-focus-key="chat"
            autocomplete="off"
            value={input}
            {...msgHandlers}
          />
          <button className="button" type="submit">
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
