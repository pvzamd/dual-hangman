# Dual Hangman — Session Bootstrap

**Read `CLAUDE_CONTEXT.md` first.** It holds the current phase, outstanding tasks, and next recommended step.

## Workflow rules for every session

1. Start by reading `CLAUDE_CONTEXT.md`, then `docs/PROGRESS.md`.
2. When completing any task, tick it off in `docs/PROGRESS.md`.
3. Before ending a session:
   - Add an entry to `docs/SESSION_NOTES.md` (date, work done, next action).
   - Update `CLAUDE_CONTEXT.md` if the phase or outstanding tasks changed.
4. Gameplay rule changes go to `docs/GAME_RULES.md` first — it is the source of truth.
5. Significant technical choices get an ADR in `docs/DECISIONS.md`.

## Conventions

- TypeScript only in `client/src/` and `server/src/` — no plain JS.
- Never commit `.env` files; keep `.env.example` current instead.
- Socket event names/payloads live in one shared location (see `docs/ARCHITECTURE.md`).
