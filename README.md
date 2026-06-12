# Dual Hangman

A real-time two-player browser game where both players simultaneously guess each other's secret words.

**Status:** Phase 0 complete — repository foundation established. No gameplay code yet.

---

## How It Works

1. Two players join the same room using a shared room code.
2. Each player secretly types a word.
3. Both players guess letters simultaneously, racing to reveal the other's word.
4. First to solve the opponent's word (or whoever exhausts fewer wrong guesses) wins.

Full rules: [docs/GAME_RULES.md](docs/GAME_RULES.md)

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
git clone https://github.com/pvzamd/dual-hangman.git
cd dual-hangman
npm install          # installs all workspace dependencies
npm run dev          # starts client (port 5173) + server (port 3001) concurrently
```

Open `http://localhost:5173` in two browser tabs (or two different browsers) to play locally.

> **Note:** `npm run dev` and the workspace `package.json` files are set up in Phase 1. The above will work once scaffolding is complete.

---

## Folder Structure

```
dual-hangman/
├── client/           # React 18 + TypeScript + Vite frontend
│   ├── public/       # static assets
│   └── src/          # app source
├── server/           # Node.js + Express + Socket.IO backend
│   └── src/          # server source
├── docs/             # project documentation
└── CLAUDE_CONTEXT.md # fast-load context for AI-assisted development
```

---

## Documentation

| File | Purpose |
|---|---|
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Goals, tech choices, status |
| [docs/GAME_RULES.md](docs/GAME_RULES.md) | Source of truth for game rules |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, component map, socket protocol |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Planned phases and future features |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Checkbox progress tracker |
| [docs/SESSION_NOTES.md](docs/SESSION_NOTES.md) | Development log by session |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architectural decision records |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hosting and environment variable guide |
| [CLAUDE_CONTEXT.md](CLAUDE_CONTEXT.md) | AI session continuity context |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Node.js, Express, Socket.IO, TypeScript
- **Realtime:** WebSocket via Socket.IO

---

## License

MIT — see [LICENSE](LICENSE)
