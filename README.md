# bun-chat

Lightweight real-time chat built on Bun (HTTP + WebSocket) with SQLite storage and a tiny custom JSX runtime.

## Getting Started

Install deps:
```bash
bun install
```

Build client bundle:
```bash
bun run build:client
```

Run locally:
```bash
bun run index.ts
# open http://localhost:3000
```

Typecheck / tests:
```bash
bun run typecheck
bun test
```

## Configuration

- `PORT` (default `3000`)
- `ALLOWED_ORIGINS` (comma-separated; empty allows any origin; same-origin always allowed)
- `MAX_CLIENTS` (default `50`)
- `DB_PATH` (default `./data/app.db`; on Fly set to `/data/app.db`)

## Project Structure

- `index.ts`: Bun server (HTTP routes + WebSocket)
- `src/db.ts`: SQLite helpers and retention
- `src/runtime/`: custom JSX runtime
- `src/client/`: TSX client (Home/Chat pages)
- `src/server/shell.tsx`: HTML shell
- `static/style.css`: shared styles
- `static/index.js`: built client bundle (generated)
- `docs/`: specs and tasks

## Deployment (Fly.io)

Files provided: `Dockerfile`, `.dockerignore`, `fly.toml`. Typical flow:
```bash
flyctl launch   # choose app/region, use Dockerfile
flyctl volumes create data --size 1 --region <region>
flyctl deploy
```
Ensure `ALLOWED_ORIGINS` in `fly.toml` matches your fly.dev domain. Data persists in `/data/app.db` on the Fly volume.
