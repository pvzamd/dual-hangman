# Dual Hangman

A real-time two-player browser game: each player sets a secret word, then they take alternating turns guessing letters of each other's word. Solve theirs before you're hanged.

**Status:** Phase 1 complete — workspace scaffolded with a typed socket contract and skeleton pages/server. Gameplay logic starts in Phase 2 (lobby system).

---

## How It Works

1. Two players join the same room using a shared room code.
2. Each player secretly types a word (3–12 letters).
3. Players alternate turns guessing one letter at a time — both boards update live.
4. Reveal the opponent's whole word to win; six wrong guesses and you're hanged.

Full rules: [docs/GAME_RULES.md](docs/GAME_RULES.md)

---

## Local Development

### Prerequisites

- Node.js **22.12+** (developed on Node 24 LTS — `nvm use 24`)
- npm 10+

### Setup

```bash
git clone https://github.com/pvzamd/dual-hangman.git
cd dual-hangman
npm install          # installs all three workspaces
npm run dev          # client on :5173 + server on :3001, concurrently
```

Open `http://localhost:5173` in two browser tabs (or two browsers) to play locally once gameplay lands.

### Other commands

```bash
npm run build        # production builds (client → dist, server → single ESM file)
npm run lint         # ESLint across all workspaces
npm run typecheck    # tsc across all workspaces
npm run format       # Prettier
```

---

## Folder Structure

```
dual-hangman/
├── shared/           # @dual-hangman/shared — game types + typed socket contract
│   └── src/          # constants.ts, types.ts, events.ts
├── client/           # React 19 + TypeScript + Vite + Tailwind 4 frontend
│   ├── public/
│   └── src/          # pages/, socket.ts, App.tsx
├── server/           # Node + Express 5 + Socket.IO backend
│   └── src/          # index.ts, socket/, rooms/, game/
├── docs/             # project documentation (see below)
└── CLAUDE_CONTEXT.md # fast-load context for AI-assisted development
```

---

## Documentation

| File                                                 | Purpose                                           |
| ---------------------------------------------------- | ------------------------------------------------- |
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Goals, tech choices, status                       |
| [docs/GAME_RULES.md](docs/GAME_RULES.md)             | Source of truth for game rules                    |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | System design, socket contract, models, lifecycle |
| [docs/ROADMAP.md](docs/ROADMAP.md)                   | Planned phases and future features                |
| [docs/PROGRESS.md](docs/PROGRESS.md)                 | Checkbox progress tracker                         |
| [docs/SESSION_NOTES.md](docs/SESSION_NOTES.md)       | Development log by session                        |
| [docs/DECISIONS.md](docs/DECISIONS.md)               | Architectural decision records (ADRs)             |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)             | Hosting and environment variable guide            |
| [CLAUDE_CONTEXT.md](CLAUDE_CONTEXT.md)               | AI session continuity context                     |

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, react-router 7
- **Backend:** Node.js, Express 5, Socket.IO 4, TypeScript (tsx dev / tsup build)
- **Shared:** `@dual-hangman/shared` — one strongly typed Socket.IO event contract for both sides

---

## License

MIT — see [LICENSE](LICENSE)
