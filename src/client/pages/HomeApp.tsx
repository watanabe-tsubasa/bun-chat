import { useEffect, useState } from "src/runtime";
import { createInputHandlers } from "../input";
import type { EventPayload } from "src/types";

interface HomeAppProps {
  $localStorage: Storage;
  $WebSocket: {
    new (url: string | URL, protocols?: string | string[] | undefined): WebSocket;
    prototype: WebSocket;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
  };
  wsUrl: (path?: string) => string;
}

export default function HomeApp({
  $localStorage,
  $WebSocket,
  wsUrl
}: HomeAppProps) {
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

  return (
    <main className="page home-center">
      <div className="card">
        <h1 className="home-title">Bun Chat</h1>
        <p className="home-sub">Lightweight Bun + WebSocket chat. Choose a name to enter.</p>
        <form onSubmit={submit} className="form-grid">
          <label className="muted" style="display:flex; flex-direction:column; gap:6px;">
            <span>Name</span>
            <input className="input" data-focus-key="name" value={name} {...nameHandlers} />
          </label>
          <button className="button" type="submit">
            Enter chat
          </button>
        </form>
        <p className="muted" style="margin-top:14px;">Connected: {count ?? "-"}</p>
        {error ? <p style="color:#ff8a8a; margin-top:8px;">{error}</p> : null}
      </div>
    </main>
  );
}
