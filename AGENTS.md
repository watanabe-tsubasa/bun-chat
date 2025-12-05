# Repository Guidelines

These notes keep contributors aligned on how this Bun-based chat app is structured and built. Keep edits focused, small, and in line with the specs in `docs/spec.md`.

## Project Structure & Module Organization
- `index.ts`: entry point; will host `Bun.serve` HTTP + WebSocket handling and SQLite access.
- `docs/spec.md`: product and architecture requirements; treat as source of truth. `docs/tasks.md` lists setup to-dos. write[x] when finished the task.
- `tsconfig.json`: strict TypeScript configuration using bundler resolution and JSX enabled for Bun’s JSX runtime.
- `bun.lock`, `package.json`: dependency lock and metadata (TypeScript as peer, Bun types as dev dependency).
- Tests and assets are not yet present; co-locate future tests beside code (e.g., `chat.test.ts`).

## Build, Test, and Development Commands
- `bun install` — install dependencies.
- `bun run index.ts` — start the app entry. Add flags or scripts as needed when HTTP/WebSocket routes are implemented.
- `bun test` — run the test suite once tests exist; prefer fast, deterministic unit tests.

## Coding Style & Naming Conventions
- Language: TypeScript ES modules (`type: "module"`, `verbatimModuleSyntax: true`); use explicit file extensions in imports when TypeScript requires it.
- Indentation: 2 spaces; keep lines concise; favor `const` and arrow functions.
- JSX: use Bun’s JSX (no React/Preact). Keep components small and pure; prefer named exports for shared utilities.
- Lint/format: Bun-friendly defaults are acceptable; if adding a formatter, align with existing style before enforcing it.

## Testing Guidelines
- Use `bun test`; name files `*.test.ts`. Keep tests near implementation for clarity.
- Cover WebSocket message flow, SQLite queries (happy path + failure handling), and JSX rendering helpers.
- For integration-style tests, mock network/DB where possible to keep runs quick.

## Commit & Pull Request Guidelines
- Commits: short, imperative subjects (e.g., `Add websocket broadcast handler`, `Fix sqlite retention query`); group related changes.
- PRs: include a brief summary, linked issue (if any), commands run (`bun test`, `bun run index.ts`), and notes on manual steps or UI screenshots when relevant.
- Keep diffs minimal and aligned with `docs/spec.md`; call out deviations explicitly.

## Security & Configuration Tips
- Do not commit secrets or production URLs; prefer environment variables for credentials if added later.
- Sanitize user-provided chat content before rendering; treat WebSocket payloads as untrusted.
- SQLite files should live in a writable data path outside version control (e.g., `./data/app.db` in local dev).***
