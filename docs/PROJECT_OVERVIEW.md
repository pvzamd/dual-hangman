# Project Overview

## Description

Dual Hangman is a real-time two-player browser game where both players simultaneously guess each other's secret words. Each player sets a word at the start of the round; both then race to solve the other's word before exhausting their allowed wrong guesses.

## Project Goals

- Build a polished, production-quality hobby project.
- Demonstrate full-stack TypeScript skills (React frontend + Node/Express/Socket.IO backend).
- Provide a fun, smooth real-time multiplayer experience playable in any modern browser with no install required.
- Keep the codebase readable enough that development can pause for weeks and resume cleanly.

## Technology Choices

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18 + TypeScript | Component model suits game UI; type safety reduces bugs |
| Bundler | Vite | Fast dev server, clean ESM output |
| Backend | Node.js + Express | Familiar ecosystem, non-blocking I/O suits sockets |
| Realtime | Socket.IO | Abstracts WebSocket fallback; room model fits game lobbies |
| Styling | CSS Modules or Tailwind | TBD at implementation phase |
| Testing | Vitest (client) + Jest (server) | Native Vite integration; standard Jest for Node |
| Hosting | TBD (see DEPLOYMENT.md) | Likely Railway or Render for server; Vercel/Netlify for client |

## Current Status

**Phase 0 — Repository Foundation (complete)**

Repository skeleton, documentation system, and folder structure established. No gameplay code exists yet.

See [ROADMAP.md](ROADMAP.md) for upcoming phases and [PROGRESS.md](PROGRESS.md) for fine-grained task tracking.
