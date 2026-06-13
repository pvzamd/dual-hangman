# Project Overview

## Description

Dual Hangman is a real-time two-player browser game where players guess each other's secret words. Each player sets a word at the start of the round; players then take turns guessing letters — a correct guess earns another guess, a wrong one passes the turn — racing to be first to fully reveal the other's word. Wrong guesses carry no penalty; the hangman figure appears only as the loser's defeat visual (ADR-009).

## Project Goals

- Build a polished, production-quality hobby project.
- Demonstrate full-stack TypeScript skills (React frontend + Node/Express/Socket.IO backend).
- Provide a fun, smooth real-time multiplayer experience playable in any modern browser with no install required.
- Keep the codebase readable enough that development can pause for weeks and resume cleanly.

## Technology Choices

| Layer        | Choice                                         | Reason                                                         |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------- |
| Frontend     | React 19 + TypeScript + Vite                   | Component model suits game UI; type safety reduces bugs        |
| Styling      | Tailwind CSS 4 (`@tailwindcss/vite`)           | Zero-config utilities; styling lives with components (ADR-005) |
| Routing      | react-router-dom 7                             | Standard SPA routing                                           |
| Backend      | Node.js (≥22.12) + Express 5                   | Familiar ecosystem, non-blocking I/O suits sockets (ADR-008)   |
| Realtime     | Socket.IO 4                                    | WebSocket with fallback; room model fits game lobbies          |
| Shared types | `@dual-hangman/shared` source-only pkg         | One compile-time socket contract for both sides (ADR-006)      |
| Dev workflow | `tsx watch` (server), Vite (client)            | Instant restarts/HMR; `concurrently` runs both from root       |
| Build        | Vite (client), tsup (server)                   | Single-file ESM server bundle including shared types           |
| Lint/format  | ESLint 10 (flat config) + Prettier             | Consistent style across all three packages                     |
| Testing      | Vitest (server live since Phase 2; client TBD) | Unit tests start with the logic they cover                     |
| Hosting      | TBD (see DEPLOYMENT.md)                        | Likely Railway/Render for server; Vercel/Netlify for client    |

## Current Status

**Phase 3 — Word Setup (complete)**

Lobby and word setup work end-to-end: rooms, sync, identity, reconnection, validated secret-word entry with ready states, and the transition to `playing` with personalized `game_started` payloads (random first turn). Server logic carries 24 Vitest tests. **Core gameplay (guessing) is next** — Phase 4, governed by ADR-009.

See [ROADMAP.md](ROADMAP.md) for upcoming phases and [PROGRESS.md](PROGRESS.md) for fine-grained task tracking.
