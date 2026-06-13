# Local Playtesting (same Wi-Fi / LAN)

How to run Dual Hangman locally and play it from a second device (a phone, tablet, or another laptop) on the same network. For cloud deployment instead, see [DEPLOYMENT.md](DEPLOYMENT.md).

> **TL;DR**
>
> 1. `nvm use 24` then `npm install` (first time only)
> 2. `npm run dev`
> 3. On the host machine open `http://localhost:5173`
> 4. On the other device open `http://<HOST-IP>:5173` (e.g. `http://192.168.1.42:5173`)
> 5. One device **Create Room**, the other **Join Room** with the code.
>
> LAN play works out of the box — no env vars to set. The client talks to the server on whatever host you opened it from.

---

## 1. Start the frontend and backend

From the repo root:

```bash
nvm use 24        # project needs Node >= 22.12; other projects here pin older Node
npm install       # first run only
npm run dev       # starts BOTH: server on :3001 and client (Vite) on :5173
```

`npm run dev` runs the server (`tsx watch`) and the client (Vite) together. On start, Vite prints something like:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.42:5173/
```

The **Network** URL is what other devices use. (On this Windows machine, run shell commands with `npm.cmd` if bare `npm` misbehaves — see `CLAUDE.md`.)

To run the two halves separately (two terminals):

```bash
npm run dev:server   # http://localhost:3001  (+ /health)
npm run dev:client   # http://localhost:5173
```

Quick backend check: open `http://localhost:3001/health` → `{"status":"ok"}`.

---

## 2. Find the host machine's IP

The host is the machine running `npm run dev`. You need its LAN IPv4 address (looks like `192.168.x.x` or `10.x.x.x`).

- **Easiest:** read the **Network:** URL that Vite printed on start.
- **Windows:** `ipconfig` → look for the active adapter's **IPv4 Address** (Wi-Fi or Ethernet). Ignore `127.0.0.1` and `169.254.x.x`.
- **macOS/Linux:** `ipconfig getifaddr en0` / `hostname -I`.

Example used throughout this doc: `192.168.1.42`.

---

## 3. Open the game on another device

Both devices must be on the **same Wi-Fi/LAN** (and the guest network / "client isolation" must be off — see troubleshooting).

| Device                        | URL to open                                             |
| ----------------------------- | ------------------------------------------------------- |
| Host machine                  | `http://localhost:5173` (or `http://192.168.1.42:5173`) |
| Phone / tablet / other laptop | `http://192.168.1.42:5173`                              |

Then: one device clicks **Create Room** and shares the 5-letter code; the other clicks **Join Room** and enters it. Each player privately submits a secret word, and play begins.

---

## 4. Required configuration

**None for LAN play.** The defaults are wired for it:

- The client connects to the socket server at the **same hostname you loaded the page from**, on port `3001`. Open `http://192.168.1.42:5173` and it connects to `http://192.168.1.42:3001` automatically (`client/src/socket.ts`).
- Vite binds to all interfaces (`server.host: true` in `client/vite.config.ts`), so the Network URL works.
- The server reflects the request origin for CORS when `CLIENT_ORIGIN` is unset (`server/src/index.ts`), so a LAN origin is accepted.

Optional overrides (you normally don't need these):

| Variable          | Where  | Effect                                                                                 |
| ----------------- | ------ | -------------------------------------------------------------------------------------- |
| `VITE_SERVER_URL` | client | Force the socket server URL (e.g. server on a different host/port).                    |
| `PORT`            | server | Change the server port (default `3001`). If you change it, also set `VITE_SERVER_URL`. |
| `CLIENT_ORIGIN`   | server | Lock CORS to one origin (production). Leaving it unset is what makes LAN "just work".  |

See `server/.env.example` and `client/.env.example`.

---

## 5. Windows Firewall

The first time the server accepts an outside connection, Windows may pop up **"Windows Defender Firewall has blocked some features of Node.js"**.

- Tick **Private networks** and click **Allow access**. (Private = home/work Wi-Fi. You do not need Public.)
- If you dismissed it and the phone now can't connect, re-allow Node:
  - Control Panel → System and Security → Windows Defender Firewall → **Allow an app or feature** → find **Node.js** entries → ensure **Private** is checked. Or add inbound rules for TCP **5173** and **3001** on the Private profile.
- Corporate/managed laptops sometimes block LAN traffic entirely via policy — if nothing works and the firewall looks fine, that's the likely cause.

---

## 6. Common Socket.IO / connection issues

| Symptom                                                              | Likely cause & fix                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phone can't load `http://<ip>:5173` at all                           | Wrong IP, devices on different networks, or firewall. Re-check the Vite **Network** URL; confirm both are on the same Wi-Fi; allow Node through the firewall (§5).                              |
| Page loads, but "Cannot reach the game server" / stuck "Connecting…" | The socket can't reach `:3001`. Confirm the server terminal is running; allow port **3001** through the firewall; make sure you opened the client by **IP**, not `localhost`, on the phone.     |
| Works on host, fails only on the phone                               | You opened `localhost:5173` on the phone (that's the phone itself). Use the host **IP** URL.                                                                                                    |
| Console shows a **CORS** error                                       | You set `CLIENT_ORIGIN` to something that doesn't match the URL you're using. Unset it for LAN play (restart the server), or set it to exactly `http://<host-ip>:5173`.                         |
| Connects, then drops after ~1 min on mobile                          | The phone slept/changed networks. Reconnection has a 60s grace (`RECONNECT_GRACE_SECONDS`); past that the absent player **forfeits** mid-game. Reopen the room URL to rejoin within the window. |
| "Guest"/public Wi-Fi: devices can't see each other                   | Many routers isolate clients on guest networks. Use a normal/private SSID or a phone hotspot.                                                                                                   |
| Changed `PORT` and now the client won't connect                      | The client assumes `:3001`. Set `VITE_SERVER_URL=http://<host-ip>:<port>` and restart the client.                                                                                               |

Tip: open the browser dev console on the failing device (or use remote debugging) — Socket.IO logs the exact connection error.

---

## 7. Multiplayer verification steps

Do these with two real devices (or two browsers, one in a private/incognito window, both pointed at the IP URL):

1. **Create + join** — Device A creates a room; the lobby shows the code and "Waiting for an opponent…". Device B joins with the code; both advance to word setup.
2. **Word setup** — Each device submits a secret word privately. Each sees its own "✓ word set" and the opponent's "choosing… → ✓". When both are in, both move to the game.
3. **Turns & streaks** — On your turn, a correct guess reveals the letter(s) and **keeps your turn**; a wrong guess passes the turn. The other device updates live within a moment.
4. **Anti-cheat** — Confirm neither device ever shows the opponent's un-guessed letters (inspect the board; only revealed letters appear).
5. **Win** — Fully reveal the opponent's word → both devices show the game-over screen with **both** words revealed; the loser sees the hangman figure.
6. **Rematch** — One device clicks **Play again**; the other sees "wants a rematch" and clicks **Accept** → both return to word setup for a new round.
7. **Decline** — Instead of accepting, the other device **Leaves** → the requester returns to the lobby.
8. **Reconnect** — Mid-game, refresh the page on one device (or toggle Wi-Fi briefly). It should rejoin the same game and restore both boards. The opponent briefly sees a "disconnected — Ns to reconnect" notice.
9. **Forfeit** — Mid-game, fully close one device's tab and wait out the grace period → the remaining device wins by forfeit ("your opponent left").

---

## 8. Full playtesting checklist

Copy this into a session note and tick as you go.

```
Setup
[ ] nvm use 24; npm install; npm run dev (server :3001 + client :5173)
[ ] GET http://localhost:3001/health → {"status":"ok"}
[ ] Host opens http://localhost:5173
[ ] Phone/2nd device opens http://<host-ip>:5173 (same Wi-Fi)
[ ] Firewall: Node allowed on Private network

Lobby
[ ] Create Room shows a 5-letter code
[ ] Join Room with a bad code → clear error
[ ] Join Room with the real code → both reach word setup
[ ] Joining a full room → "room already has two players"

Word setup
[ ] Word < 3 or > 12 letters / non-letters → rejected with a hint
[ ] Each side sees ready badges; both ready → game starts
[ ] Refresh during setup → returns to the correct screen

Gameplay
[ ] Correct guess reveals all occurrences and keeps the turn
[ ] Wrong guess passes the turn (turn indicator flips on both devices)
[ ] Already-guessed letters are disabled on the keyboard
[ ] Guessing out of turn is not possible / rejected
[ ] Boards update live on BOTH devices
[ ] Opponent's hidden letters are never visible

Game over
[ ] Solving the word ends the game on both devices
[ ] Both secret words are revealed
[ ] Loser sees the hangman figure; banner names the winner

Rematch
[ ] Play again + Accept → fresh round (new words, random first turn)
[ ] Decline (Leave) → other player returns to the lobby
[ ] Opponent gone → "rematch unavailable" → back to the lobby

Resilience
[ ] Refresh mid-game → rejoins and restores boards
[ ] Disconnect past 60s mid-game → opponent wins by forfeit

Feel / polish notes (free text)
[ ] ...
```

---

## Related docs

- [README.md](../README.md) — quick start
- [START_HERE.md](../START_HERE.md) — project entry point
- [GAME_RULES.md](GAME_RULES.md) — what the verification steps are checking
- [DEPLOYMENT.md](DEPLOYMENT.md) — running on the public internet instead of LAN
