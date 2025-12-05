# tasks.md

## 0. Project Setup
- [ ] Ensure Bun v1.3.3+ installed; run `bun install`.
- [ ] Initialize git repo (if not already).
- [ ] Confirm TypeScript peer is available (`npm i -D typescript@^5` if missing).

## 1. Database (bun:sqlite)
- [x] Create `messages` table with columns `(id INTEGER PK AUTOINCREMENT, name TEXT, message TEXT, ts INTEGER)`.
- [x] Add retention: remove rows older than current day on startup or scheduled interval.
- [x] Implement query to fetch latest 5 messages ordered by `ts DESC LIMIT 5`.

## 2. Server (Bun.serve)
- [x] Implement HTTP routes:
  - [x] `GET /` → serves top page.
  - [x] `GET /chat` → serves chat page.
  - [x] `GET /api/messages` → returns latest 5 messages from DB.
  - [x] `POST /api/messages` → validate payload, save to DB.
  - [x] Static `/static/*` (JS, CSS, assets).
- [x] Implement WebSocket route `/ws`:
  - [x] Track connected clients (`Set<WebSocket>`).
  - [x] On message: validate, persist, broadcast to all clients.
  - [x] Broadcast user count updates.
  - [x] Ensure payloads include `{ type: "chat", payload: { name, message, ts } }`.

## 3. Frontend (Bun JSX + custom h/render/hooks)
- [x] Implement lightweight JSX runtime helpers: `h()`, `render()`, `useState()`, `useEffect()`.
- [x] Build top page `/`:
  - [x] Name input, validation on submit.
  - [x] Store `chat_name` in `localStorage`.
  - [x] Redirect to `/chat` when valid.
  - [x] Show current WebSocket connection count.
- [x] Build chat page `/chat`:
  - [x] Fetch and display last 5 messages on load (ChatGPT/LINE-style bubbles).
  - [x] Maintain state: `messages`, `input`, `ws`, `username`.
  - [x] Send message via button or Enter; WebSocket send.
  - [x] Receive broadcasts and update UI.
  - [x] Distinguish own vs others’ messages in layout.
- [x] Replace vanilla DOM scripts with JSX runtime components for `/` and `/chat`.

## 3b. JSX Runtime Implementation
- [x] `h(type, props, ...children)` returns VNode.
- [x] `render(vnode, container)` mounts to DOM (append-only acceptable).
- [x] `useState` with tuple `[value, setValue]` and rerender.
- [x] `useEffect` with dependency tracking and cleanup support.
- [x] Basic sanitizer/escape for text nodes to prevent XSS.

## 4. Security, Quality, and Ops
- [x] Sanitize/escape user content before rendering to avoid XSS.
- [x] typecheck `bun run typecheck`.
- [x] Validate WebSocket origins; handle invalid payloads safely.
- [x] Keep memory/CPU light (target fly.io free tier).
- [x] Prepare for SQLite file location (e.g., `/data/app.db` or `./data/app.db`); exclude from git.

## 5. Testing
- [ ] Add `bun test` coverage for:
  - [x] DB queries (limit/ordering, retention).
  - [x] WebSocket broadcast handling.
  - [x] JSX helpers and UI state transitions.
  - [x] API history fetch and UI render of messages.
- [x] Keep tests fast and deterministic; mock network/DB where practical.

## 6. Refactor
- [x] Convert HTML like strings to TSX file.
- [x] Use TSX file by [bun_jsx](https://bun.com/docs/runtime/jsx).

## 7. User Test
- [x] Local chat flow (single user):
  - [x] Load `/`, set name, verify presence count updates.
  - [x] Navigate to `/chat`, ensure last 5 messages load.
  - [x] Send a message; confirm it appears with own styling and persists on refresh.
- [x] Multi-client sync:
  - [x] Open two browsers; send messages and confirm real-time delivery both ways.
  - [x] Observe presence count increments/decrements on connect/disconnect.
- [ ] Validation and limits:
  - [x] Empty name on `/` blocks entry with inline error.
  - [x] Empty message is ignored; long messages are clamped and still broadcast.
  - [x] Payload >2KB returns 413 (check via DevTools/fetch).
- [ ] Resilience:
  - [x] Simulate WS drop (toggle offline) and ensure reconnect or POST fallback delivers message.
  - [x] Confirm `/api/messages` rejects disallowed origins when `ALLOWED_ORIGINS` is set.

## 8. Fixes from user testing
- [x] Prevent input blur while typing (name and chat fields).
- [x] Enforce origin allowlist on API/WS requests.
- [x] Fix message history fetch/display regression.

## 9. refactor2

- [x] convert h function style to .tsx files components
- [x] divide pages and components

## 10. UI improvement

- [x] Polish overall UI to feel modern and visually appealing
- [x] Fix chat layout: keep header and message input bar(composer) sticky at the top, and make the message list scrollable when it exceeds the remaining viewport area
- [x] Extract global/chat styles into a shared CSS file

## 11. additional requirements
- [x] Reject duplicate usernames when joining the chat (active session name must be unique).
- [x] Add a header exit button in chat to leave/redirect to home.

## 11. additional requirements
