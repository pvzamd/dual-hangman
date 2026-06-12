# Architecture

> Implemented in Phase 1. The socket contract here mirrors `shared/src/events.ts` — that file is the compile-time truth; keep this document in sync with it.

## High-Level Overview

```
Browser (Player A)          Browser (Player B)
       │                           │
       │  WebSocket (Socket.IO)    │
       └──────────┬────────────────┘
                  │
          ┌───────▼─────────┐
          │ Node / Express  │
          │ + Socket.IO     │
          └───────┬─────────┘
                  │  In-memory room state
                  │  (no DB at MVP — ADR-002)
                  └─ (future: Redis or DB)
```

The server is authoritative: clients never hold the opponent's secret word and all rule enforcement happens server-side.

## Monorepo Layout

npm workspaces with three packages:

```
dual-hangman/
├── shared/                  @dual-hangman/shared — types only, no build step
│   └── src/
│       ├── constants.ts     ← word length limits, room code charset, reconnect grace
│       ├── types.ts         ← GameView, BoardView, PlayerInfo, RoomPhase, ErrorCode
│       ├── events.ts        ← ClientToServerEvents / ServerToClientEvents contract
│       └── index.ts
├── client/                  @dual-hangman/client — React SPA
│   ├── public/
│   └── src/
│       ├── pages/           ← HomePage, CreateRoomPage, JoinRoomPage, LobbyPage (wired)
│       ├── lib/identity.ts  ← localStorage identity persistence (ADR-010)
│       ├── socket.ts        ← typed Socket.IO client singleton
│       ├── App.tsx          ← routes
│       ├── main.tsx         ← entry
│       └── index.css        ← Tailwind entry (@import 'tailwindcss')
├── server/                  @dual-hangman/server — Node backend
│   └── src/
│       ├── index.ts                         ← Express + Socket.IO bootstrap, /health
│       ├── socket/types.ts                  ← GameServer/GameSocket generics + SocketData
│       ├── socket/registerSocketHandlers.ts ← lobby handlers live; word/guess/chat stubbed
│       ├── rooms/RoomManager.ts             ← rooms, join/leave, reconnect, grace timers
│       ├── rooms/RoomManager.test.ts        ← Vitest unit tests
│       ├── rooms/roomView.ts                ← Room → client-safe GameView projection
│       └── game/GameManager.ts              ← per-room rules engine (skeleton, Phase 4)
└── docs/
```

**How `shared` is consumed:** it is a source-only package (`main`/`types` point at `src/index.ts`). Vite and `tsx` compile the TS source on the fly in dev; for the production server build, `tsup` bundles it into `server/dist/index.js` (`noExternal` in `tsup.config.ts`). There is deliberately no build step for `shared` — see ADR-006.

## Frontend

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS 4 (via `@tailwindcss/vite`), react-router-dom 7.
- **Routes:** `/` (home), `/create`, `/join`, `/lobby/:roomCode`. Game and result screens are added in Phases 3–5.
- **Socket client:** `src/socket.ts` exports one `Socket<ServerToClientEvents, ClientToServerEvents>` singleton with `autoConnect: false`; flows that need the server call `socket.connect()`.
- **State management:** local component state for now. When gameplay lands (Phase 4), a single `useGame` hook will own the socket subscription and the latest `GameView`; the server's full-state payloads (`state_sync`, `guess_result.state`) keep client state a pure projection — no client-side rule logic.

## Backend

- **Stack:** Node.js ≥ 22.12 (developed on 24), Express 5, Socket.IO 4, TypeScript.
- **Dev workflow:** `tsx watch src/index.ts` (restart on change). **Build:** `tsup` → single ESM file `dist/index.js`. **Run:** `node dist/index.js`.
- **HTTP surface:** `GET /health` → `{ "status": "ok" }`. Everything else is Socket.IO.
- **Env:** `PORT` (default 3001), `CLIENT_ORIGIN` (default `http://localhost:5173`, used for CORS).

### Server-side models

`ServerPlayer` (in `RoomManager.ts`) is the authoritative player record:

| Field            | Notes                                                      |
| ---------------- | ---------------------------------------------------------- |
| `id`             | UUID, stable across reconnections                          |
| `name`           | Display name                                               |
| `socketId`       | Current socket, `null` while disconnected                  |
| `reconnectToken` | Random secret issued at join; proves identity on reconnect |
| `connected`      | Drives `opponent_disconnected` / grace timer               |
| `secretWord`     | **Never leaves the server** until game over reveals it     |

`Room` holds `code`, `phase`, `players[]`, a `GameManager` once playing, and activity timestamps for idle cleanup.

The shared `PlayerInfo` / `GameView` types are the _client-safe projections_ of these records.

## Room Lifecycle

```
create_room ──► waiting_for_opponent
                     │ join_room (2nd player)
                     ▼
                word_setup ◄────────────────┐
                     │ both submit_secret_word │ rematch (Phase 5)
                     ▼                       │
                 playing                     │
                     │ win / hang / forfeit  │
                     ▼                       │
                 game_over ──────────────────┘
```

A room is destroyed when: both players leave, the waiting host disconnects past the grace period, or it sits idle longer than `ROOM_IDLE_TIMEOUT_MINUTES` (sweep implemented in Phase 6).

## Turn Model

Turn-based with streaks (ADR-004, revised by ADR-009). The first turn is assigned randomly when the round starts. The active player guesses one letter:

- **Correct** → the player keeps the turn and guesses again immediately (`turn_changed` is NOT emitted).
- **Wrong** → recorded for statistics only, and the turn passes to the opponent (`turn_changed` emitted).

The server rejects out-of-turn guesses with `NOT_YOUR_TURN` and repeat guesses with `ALREADY_GUESSED` (a rejected repeat does not end the turn).

## Win Conditions

Evaluated server-side after every guess:

1. **word_solved** — the guess revealed the last hidden letter of the opponent's word → guesser wins. **This is the only gameplay win condition.**
2. **opponent_forfeit** — a player leaves or fails to reconnect within the grace period → remaining player wins.

There is **no loss by wrong guesses** (ADR-009): `wrongGuesses` in `BoardView` is statistics/UI data, and the hangman figure is a cosmetic visual drawn only for the loser at game over. A draw remains impossible — letters never repeat against the same word, so every turn permanently consumes at least one of 26 letters until someone's word is fully revealed.

## Socket Event Contract

Compile-time truth: `shared/src/events.ts`. Both sides instantiate Socket.IO with these generics, so emits and handlers are type-checked everywhere.

### Client → Server

| Event                | Payload                                  | Phase |
| -------------------- | ---------------------------------------- | ----- |
| `create_room`        | `{ playerName }`                         | 2     |
| `join_room`          | `{ roomCode, playerName }`               | 2     |
| `submit_secret_word` | `{ word }`                               | 3     |
| `guess_letter`       | `{ letter }`                             | 4     |
| `reconnect_player`   | `{ roomCode, playerId, reconnectToken }` | 6     |
| `leave_room`         | —                                        | 2     |
| `chat_message`       | `{ text }`                               | 6     |

### Server → Client

| Event                   | Payload                                            | Meaning                                           |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------- |
| `room_created`          | `{ roomCode, playerId, reconnectToken }`           | Room ready; show lobby                            |
| `room_joined`           | `{ roomCode, playerId, reconnectToken, opponent }` | Join confirmed (to joiner)                        |
| `opponent_joined`       | `{ opponent }`                                     | Second player arrived (to host)                   |
| `word_setup_started`    | —                                                  | Show secret-word form                             |
| `opponent_word_ready`   | —                                                  | Opponent locked in (word not sent)                |
| `game_started`          | `{ state }`                                        | Round begins; includes first turn                 |
| `guess_result`          | `{ guesserId, letter, correct, state }`            | Outcome of a guess + full refreshed state         |
| `turn_changed`          | `{ activePlayerId }`                               | Whose turn it is now                              |
| `game_won`              | `{ winnerId, reason, state }`                      | Round over; state reveals the unsolved word       |
| `opponent_disconnected` | `{ graceSeconds }`                                 | Grace timer started                               |
| `opponent_reconnected`  | —                                                  | Opponent came back                                |
| `state_sync`            | `{ state }`                                        | Full resync (after reconnect / phase transitions) |
| `chat_message`          | `{ senderId, senderName, text }`                   | Chat broadcast                                    |
| `error_occurred`        | `{ code, message }`                                | Typed error (`ErrorCode` union in `types.ts`)     |

## Game State Model

Clients only ever receive `GameView` — a per-player projection built by `GameManager.buildViewFor(playerId)`:

- `yourBoard` — your progress guessing the **opponent's** word (`maskedWord` hides unrevealed letters as `null`).
- `opponentBoard` — the opponent's progress guessing **your** word.
- `activePlayerId`, `winnerId`, `gameOverReason`, and `opponentWordRevealed` (populated only at game over).

**Anti-cheat invariant:** the opponent's unsolved word never appears in any payload. Guess validation, turn order, and win detection are exclusively server-side.

## Reconnection Strategy (lobby-level implemented in Phase 2)

1. `room_created` / `room_joined` give the client `{ roomCode, playerId, reconnectToken }`; the client persists them in `localStorage` (`client/src/lib/identity.ts`).
2. On disconnect, the server marks the player `connected: false`, starts a `RECONNECT_GRACE_SECONDS` (60s) timer, and notifies the opponent (`opponent_disconnected`).
3. The reconnecting client emits `reconnect_player` with its stored credentials. The server validates the token, rebinds the new socket, cancels the timer, replies with `state_sync`, and notifies the opponent (`opponent_reconnected`).
4. The lobby page uses the **same path as its mount-time sync** (ADR-010): it emits `reconnect_player` on every socket `connect`, so refresh, navigation, and transient drops all converge on `state_sync`.
5. Grace expiry in lobby phases removes the player — the room reverts to `waiting_for_opponent` (or is destroyed if empty). **TODO Phase 4:** expiry during `playing` must forfeit (`game_won` with `opponent_forfeit`) instead.

Game state lives only in server memory, so a **server** restart still ends all games (accepted — ADR-002).
