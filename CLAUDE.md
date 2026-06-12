# Dual Hangman — Claude Code Bootstrap

**Read `START_HERE.md` first** — it is the entry point for every session (human or AI) and contains the documentation map, development workflow, and the mandatory documentation maintenance rules. Follow them.

Quick orientation after that: `docs/PROGRESS.md` (what's done) → `CLAUDE_CONTEXT.md` (detailed task list and repo map) → latest entry of `docs/SESSION_NOTES.md`.

## Machine/tooling quirks (Claude Code on this Windows machine)

- **Use `npm.cmd`, not `npm`** — bare `npm` trips a harness error ("undefined is not an object"). Some commands (curl with query-string URLs, hyphenated script filenames) intermittently hit the same bug: rewrite the command simpler and redirect output to a file instead of retrying verbatim.
- Node is managed by nvm-windows; this project needs Node ≥ 22.12 → `nvm use 24`. Don't assume the machine default — other local projects pin Node 14/16/18.
- Prefer Git Bash over PowerShell for noisy commands; send output to a log file and read that.

## Project conventions (enforced; full list in START_HERE.md §6)

- TypeScript only in `src/` directories — no plain JS.
- Socket events are defined ONLY in `shared/src/events.ts` (snake_case); both sides type against it. Keep `docs/ARCHITECTURE.md` tables in sync when it changes.
- Gameplay changes: update `docs/GAME_RULES.md` **before** writing code.
- Significant technical choices get the next ADR in `docs/DECISIONS.md`.
- Never commit `.env`; keep `.env.example` files current.
