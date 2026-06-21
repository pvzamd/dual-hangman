# Changelog

All notable changes to Dual Hangman are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/); this project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-06-14

First feature-complete release. Phases 0–7 of the roadmap are complete.

### Highlights

- **Multiplayer rooms** — create or join a game with a short room code.
- **Secret word setup** and **turn-based guessing** with correct-guess **streak** mechanics (a correct guess earns another guess; a wrong one passes the turn).
- **Win by full reveal** — first to reveal the opponent's whole word wins; wrong guesses carry no penalty (ADR-009).
- **Live synchronization** over Socket.IO with a server-authoritative, strongly typed event contract.
- **Reconnection & grace-period recovery** — rejoin within 60s after a drop; the room and boards are restored.
- **Forfeit handling** — leaving or timing out mid-game awards the opponent the win.
- **Game-over flow & rematch** — both secret words revealed, a cosmetic defeat figure for the loser, and mutual-opt-in rematch that keeps the room.
- **Session score tracking** across rounds within a room (in-memory; persists through rematches).
- **In-game chat** — ephemeral, per-room.
- **Responsive, mobile-friendly UI** with a prominent turn indicator.
- **Sound effects** (subtle, mutable) and **accessibility-conscious animations** (honours `prefers-reduced-motion`).
- **Resilience** — idle rooms are swept automatically.
- **Local-network playtesting support** — play from a phone on the same Wi-Fi out of the box.

### Engineering

- Documentation-first, phased development (Phases 0–7), with 14 ADRs, a full architecture document, roadmap, and cold-start onboarding docs.
- Three-package npm-workspaces monorepo (`shared`, `client`, `server`); TypeScript throughout; the socket contract is shared and compile-time-checked on both sides.
- 64 server/shared unit tests (Vitest); `typecheck`, `lint`, and production builds all green.
- Built as an AI-assisted experiment using Claude Code, with documentation-first development, automated testing, and continuous review.

### Status

Feature complete. **Deployment pending** — see [docs/MUST_FIX_BEFORE_DEPLOY.md](docs/MUST_FIX_BEFORE_DEPLOY.md) before a public deploy and [docs/RELEASE_READINESS.md](docs/RELEASE_READINESS.md) for the full review.

### Known limitations (by design — ADR-002)

- In-memory state only (a server restart drops active rooms/scores); single server instance (no horizontal scaling); no accounts, persistence, leaderboards, or match history.

[1.0.0]: https://github.com/pvzamd/dual-hangman/releases/tag/v1.0.0
