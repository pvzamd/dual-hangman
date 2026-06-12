# Architecture

## High-Level Overview

```
Browser (Player A)          Browser (Player B)
       │                           │
       │  WebSocket (Socket.IO)    │
       └──────────┬────────────────┘
                  │
          ┌───────▼───────┐
          │  Node / Express │
          │  + Socket.IO    │
          │  server         │
          └───────┬────────┘
                  │  In-memory game state
                  │  (no DB at MVP)
                  └─ (future: Redis or DB)
```

## Frontend Architecture

**Framework:** React 18 with TypeScript  
**Bundler:** Vite  
**Entry point:** `client/src/main.tsx`

### Component Hierarchy (planned)

```
App
├── LobbyPage
│   ├── CreateRoomForm
│   └── JoinRoomForm
├── WordSetupPage
│   └── SecretWordInput
├── GamePage
│   ├── OpponentBoard       ← the word I am trying to guess
│   │   ├── HangmanFigure
│   │   ├── WordDisplay
│   │   └── GuessedLetters
│   ├── MyBoard             ← the word my opponent is guessing
│   │   ├── HangmanFigure
│   │   ├── WordDisplay
│   │   └── GuessedLetters
│   ├── Keyboard
│   └── GameChat
└── ResultPage
```

### State Management

Local component state for UI. A single `useGame` hook (or Zustand store — TBD) will own:
- Socket connection lifecycle
- Game phase (`lobby | setup | playing | result`)
- Room metadata
- Both board states (my board, opponent board)

### Socket Client

`client/src/socket.ts` — singleton Socket.IO client instance, exported for use in hooks/components.

## Backend Architecture

**Runtime:** Node.js 20+  
**Framework:** Express (HTTP) + Socket.IO (WebSocket)  
**Entry point:** `server/src/index.ts`

### Module Breakdown (planned)

```
server/src/
├── index.ts          ← Express + Socket.IO bootstrap
├── socket/
│   ├── handlers.ts   ← event handler registration
│   └── events.ts     ← event name constants (shared type source)
├── game/
│   ├── Room.ts       ← Room class: state machine for one game session
│   ├── Player.ts     ← Player model
│   └── WordValidator.ts
└── store/
    └── RoomStore.ts  ← in-memory Map<roomId, Room>
```

### Game State Machine

Each `Room` transitions through these phases:

```
WAITING → SETUP → PLAYING → ROUND_OVER → (WAITING or FINISHED)
```

## Socket Event Protocol

All events are namespaced under `/game`.

| Direction | Event | Payload | Meaning |
|---|---|---|---|
| Client → Server | `room:create` | `{ playerName }` | Create a new room |
| Client → Server | `room:join` | `{ roomCode, playerName }` | Join existing room |
| Client → Server | `word:submit` | `{ word }` | Submit secret word for round |
| Client → Server | `guess:letter` | `{ letter }` | Guess a letter |
| Client → Server | `chat:message` | `{ text }` | Send chat message |
| Server → Client | `room:joined` | `{ roomCode, playerId }` | Confirms join, returns room code |
| Server → Client | `game:state` | `GameState` | Full state snapshot |
| Server → Client | `game:update` | `Partial<GameState>` | Incremental state update |
| Server → Client | `game:over` | `{ winner, reason }` | Round/game result |
| Server → Client | `chat:message` | `{ sender, text }` | Broadcast chat |
| Server → Client | `error` | `{ code, message }` | Error feedback |

## Folder Structure

```
dual-hangman/
├── client/
│   ├── public/          ← static assets (favicon, etc.)
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── socket.ts
│       ├── types.ts
│       ├── App.tsx
│       └── main.tsx
├── server/
│   └── src/
│       ├── game/
│       ├── socket/
│       ├── store/
│       └── index.ts
├── docs/
├── CLAUDE_CONTEXT.md
├── README.md
└── package.json (workspaces root, optional)
```

## Shared Types

A `shared/` directory (or a `types.ts` published from server) will hold types used by both client and server (e.g. `GameState`, `PlayerState`, event payloads). This avoids duplication and keeps the protocol contract in one place.
