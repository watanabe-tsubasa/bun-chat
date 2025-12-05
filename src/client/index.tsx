import { createRenderer } from "../runtime";
import ChatApp from "./pages/ChatApp";
import HomeApp from "./pages/HomeApp";

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
  const wsRef = { current: null as WebSocket | null };

  function mount(root: Element | null = document.getElementById("app")) {
    if (!root) return;
    const page = (root as any).dataset?.page;
    const renderer =
      page === "chat"
        ? createRenderer(() => (
            <ChatApp
              $localStorage={$localStorage}
              $fetch={$fetch}
              $WebSocket={$WebSocket}
              wsUrl={wsUrl}
              wsRef={wsRef}
            />
          ), root)
        : createRenderer(() => (
            <HomeApp
              $localStorage={$localStorage}
              $WebSocket={$WebSocket}
              wsUrl={wsUrl}
            />
          ), root);
    renderer.render();
    return renderer;
  }

  return { mount };
}

const app = createApp();
app.mount();
