# Must Fix Before Deploy

> Blockers for a **public, unattended internet deployment**. None are needed for LAN / friends-only play (see [LOCAL_PLAYTESTING.md](LOCAL_PLAYTESTING.md)).
> These are configuration and one small safeguard — **no new features, no gameplay changes**. Full context in [RELEASE_READINESS.md](RELEASE_READINESS.md).

Ordered by priority.

## 1. Lock down CORS in production (`CLIENT_ORIGIN`)

**Why:** With `CLIENT_ORIGIN` unset, the server reflects _any_ request origin (`server/src/index.ts`) — intentional for LAN dev, wrong for public. A deployed server must only accept its real client origin.

**Fix:** Set `CLIENT_ORIGIN=https://<your-client-domain>` in the server's production environment. Verify the server logs `CORS origin: https://…` (not `reflect any`).

## 2. Point the client at the deployed server over TLS (`VITE_SERVER_URL`)

**Why:** When `VITE_SERVER_URL` is unset the client connects to `http://<page-host>:3001` (`client/src/socket.ts`) — correct for LAN, but a deployed HTTPS page **cannot** open an `http://`/`ws://` socket (mixed content), and the server usually isn't on `:3001` of the client's host.

**Fix:** Build the client with `VITE_SERVER_URL=https://<your-server-domain>` so Socket.IO upgrades to **wss://**. Ensure the server sits behind the platform's TLS (Railway/Render/Fly terminate TLS for you). See [DEPLOYMENT.md](DEPLOYMENT.md).

## 3. Run exactly one server instance (no autoscaling)

**Why:** All room/game/score state is in one process's memory (ADR-002). Multiple replicas would split players across processes and silently break room joins and reconnection.

**Fix:** Configure the host for a **single instance** and disable autoscaling/min-replicas > 1. (Sticky sessions are not enough — there is no shared store.) Revisit only if a Redis adapter is added later.

## 4. Guard against unauthenticated room-creation abuse (DoS)

**Why:** `create_room` is unauthenticated, unthrottled, and uncapped. On a single instance, a script can create rooms until memory is exhausted; the idle sweep only reclaims after 30 minutes.

**Fix (minimum viable):** add a basic safeguard before public exposure — e.g. a per-connection/IP rate limit on `create_room` and/or a cap on total concurrent rooms (reject with an error past the cap). This is a small server-side change, not a feature. If the deployment is private/link-shared and low-traffic, this can be downgraded to NICE_TO_HAVE — decide based on exposure.

---

## Pre-deploy smoke checklist

- [ ] `CLIENT_ORIGIN` set to the client domain; server log shows it (not "reflect any").
- [ ] `VITE_SERVER_URL` set to the `https://` server domain; client connects via `wss://` (check the browser network tab).
- [ ] Host pinned to one instance; autoscaling off.
- [ ] Room-creation safeguard in place (or risk explicitly accepted for a private deploy).
- [ ] `GET /health` returns `{"status":"ok"}` through the public URL.
- [ ] A real two-device game completes (create → join → play → game over → rematch) over the public URL.
