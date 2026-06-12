# Roadmap

## Phase 0 — Repository Foundation ✅
- [x] Git repository initialised
- [x] `.gitignore` configured
- [x] `docs/` documentation system created
- [x] `CLAUDE_CONTEXT.md` created
- [x] Folder skeleton: `client/`, `server/`, `docs/`
- [x] `README.md` written

## Phase 1 — Project Scaffolding
- [ ] Initialise client: `vite` + React + TypeScript
- [ ] Initialise server: Node + Express + Socket.IO + TypeScript (`ts-node` or `tsx`)
- [ ] Set up root `package.json` with workspaces (client + server)
- [ ] Configure `tsconfig` for both packages
- [ ] Add basic ESLint + Prettier config
- [ ] Add `dev` script that runs both client and server concurrently
- [ ] Verify "hello world" on both ends

## Phase 2 — Lobby System
- [ ] Server: room creation and join logic
- [ ] Server: `room:create` and `room:join` socket events
- [ ] Client: Lobby page — create or join a room
- [ ] Client: display room code, waiting state
- [ ] Basic error handling (room not found, room full)

## Phase 3 — Word Setup
- [ ] Server: `word:submit` event, transition to PLAYING when both players ready
- [ ] Client: secret word input screen (hidden from opponent)
- [ ] Word validation (length, letters only)

## Phase 4 — Core Gameplay
- [ ] Server: `guess:letter` event handler, wrong-guess counting, win/lose detection
- [ ] Client: render hangman figure (SVG)
- [ ] Client: render word display with blanks and revealed letters
- [ ] Client: on-screen keyboard — disable guessed letters
- [ ] Real-time sync: both boards update live for both players

## Phase 5 — Game Over & Restart
- [ ] Server: `game:over` broadcast with winner/reason
- [ ] Client: result screen — who won, final board states
- [ ] Rematch / new round flow

## Phase 6 — Polish
- [ ] Chat sidebar
- [ ] Animations (letter reveal, hangman draw)
- [ ] Responsive layout (mobile-friendly)
- [ ] Sound effects (optional)
- [ ] Connection drop handling / reconnection

## Phase 7 — Scoring & Multi-Round
- [ ] Persistent score across rounds in a session
- [ ] Best-of-N match config

## Nice-to-Have / Future
- [ ] Word categories / difficulty levels
- [ ] Word validation against a dictionary API
- [ ] Spectator mode
- [ ] Persistent leaderboard (requires DB)
- [ ] OAuth login (GitHub / Google)
- [ ] PWA / installable
- [ ] Dark mode toggle
