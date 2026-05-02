# Leaderboard Backend Contract

This document defines the lightweight Cloudflare Worker leaderboard API scaffold in `workers/leaderboard-worker.js`.

## Storage Model

The worker supports two free-tier friendly modes:

- Durable Object mode: bind `LEADERBOARD_DO` to `LeaderboardDurableObject`. This is preferred for real events because writes for the same season are serialized.
- KV mode: bind `LEADERBOARD_KV`. This is the simplest low-cost mode, but simultaneous writes can race.

Entries are stored per season and trimmed to the top 100 after every accepted score. Public responses expose `clientIdHash`, not the raw `clientId`.

## GET `/leaderboard?season=...`

Returns the current top 100 for a season.

### Query

- `season`: required. `1-48` chars, letters/numbers plus `.`, `_`, `-`.

### Response `200`

```json
{
  "season": "2026-w18",
  "updatedAt": "2026-05-02T12:00:00.000Z",
  "limit": 100,
  "entries": [
    {
      "rank": 1,
      "clientIdHash": "0123456789abcdef0123456789abcdef",
      "score": 12345,
      "name": "Yugi",
      "sns": "@yugi",
      "comment": "first clear",
      "submittedAt": "2026-05-02T12:00:00.000Z",
      "updatedAt": "2026-05-02T12:00:00.000Z"
    }
  ]
}
```

## POST `/leaderboard`

Registers a score for one client in one season. A client can improve its own score; lower or equal scores are ignored.

### Request

```json
{
  "season": "2026-w18",
  "clientId": "demo-client-01",
  "score": 12345,
  "profile": {
    "name": "Yugi",
    "sns": "@yugi",
    "comment": "first clear"
  }
}
```

### Field Rules

- `season`: required, `1-48` chars, letters/numbers plus `.`, `_`, `-`.
- `clientId`: required unless supplied by `X-Client-Id`, `8-80` chars, letters/numbers plus `_` and `-`.
- `score`: required integer, default range `0..999999999`.
- `profile.name`: optional, max `24` chars, defaults to `Player`.
- `profile.sns`: optional, max `80` chars.
- `profile.comment`: optional, max `120` chars.

Control characters and angle brackets are removed from profile text.

### Response `201`

```json
{
  "accepted": true,
  "reason": "accepted",
  "season": "2026-w18",
  "entry": {
    "rank": 1,
    "clientIdHash": "0123456789abcdef0123456789abcdef",
    "score": 12345,
    "name": "Yugi",
    "sns": "@yugi",
    "comment": "first clear",
    "submittedAt": "2026-05-02T12:00:00.000Z",
    "updatedAt": "2026-05-02T12:00:00.000Z"
  },
  "leaderboard": []
}
```

### Non-improving Response `200`

```json
{
  "accepted": false,
  "reason": "score_not_improved",
  "season": "2026-w18",
  "entry": {},
  "leaderboard": []
}
```

### Rate Limit Response `429`

```json
{
  "error": "cooldown_active",
  "retryAfter": 30
}
```

## CORS

The worker handles `OPTIONS` preflight and allows:

- Methods: `GET`, `POST`, `OPTIONS`
- Headers: `Content-Type`, `X-Client-Id`

Set `ALLOWED_ORIGINS` to a comma-separated list for production. If omitted, `Access-Control-Allow-Origin: *` is returned.

## Client Integration Notes

The game client already contains a remote-sync adapter in `src/systems/remoteLeaderboard.ts`.

- `public/config/leaderboard.json` keeps remote ranking disabled by default.
- Set `"enabled": true` and `"endpoint": "https://<worker-host>"` after deploying the worker.
- For local testing, open the game with `?leaderboard=http://127.0.0.1:8787`.
- `?leaderboard=off` disables remote reads/writes and leaves the local leaderboard active.

Generate and persist a random client ID on the client, then send it with each score. The backend hashes it before storing or returning entries.

Example:

```js
const clientId = crypto.randomUUID().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);

await fetch(`${LEADERBOARD_URL}/leaderboard`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    season: "2026-w18",
    clientId,
    score,
    profile: { name, sns, comment },
  }),
});
```

For a polling UI, call `GET /leaderboard?season=...` on a timer such as every `15-60` seconds. Avoid polling every frame.
