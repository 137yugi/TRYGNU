# Leaderboard Worker

Lightweight Cloudflare Worker scaffold for an automatically refreshed leaderboard that does not rely on browser localStorage.

## Files

- `workers/leaderboard-worker.js`: Worker module entrypoint plus optional Durable Object class.
- `docs/leaderboard-backend.md`: API contract and deployment notes.

## Bindings

Use one of these storage modes:

### KV-only

```toml
name = "stream-raid-leaderboard"
main = "workers/leaderboard-worker.js"
compatibility_date = "2026-05-02"

[[kv_namespaces]]
binding = "LEADERBOARD_KV"
id = "<kv_namespace_id>"
```

### Durable Object preferred, KV fallback optional

```toml
name = "stream-raid-leaderboard"
main = "workers/leaderboard-worker.js"
compatibility_date = "2026-05-02"

[[durable_objects.bindings]]
name = "LEADERBOARD_DO"
class_name = "LeaderboardDurableObject"

[[migrations]]
tag = "v1"
new_classes = ["LeaderboardDurableObject"]
```

Durable Object mode serializes writes by season and is safer for active events. KV-only mode is cheaper and simpler, but concurrent score submissions can race.

## Optional variables

```toml
[vars]
ALLOWED_ORIGINS = "https://example.com,http://127.0.0.1:5173"
CLIENT_ID_SALT = "change-me"
COOLDOWN_SECONDS = "30"
DAILY_SUBMIT_LIMIT = "60"
MAX_SCORE = "999999999"
```

If `ALLOWED_ORIGINS` is omitted, the worker returns permissive CORS headers.

## Local smoke commands

```bash
curl "http://127.0.0.1:8787/leaderboard?season=2026-w18"
curl -X POST "http://127.0.0.1:8787/leaderboard" \
  -H "Content-Type: application/json" \
  -d '{"season":"2026-w18","clientId":"demo-client-01","score":12345,"profile":{"name":"Yugi","sns":"@yugi","comment":"first clear"}}'
```

## Spam controls

This worker has no account authentication. It limits obvious abuse with:

- `season` and `score` validation.
- client-generated `clientId` format validation.
- hashed client IDs in public responses.
- one submission per client per season per cooldown window.
- per-client daily submission quota.
- top 100 storage cap.

These checks are not anti-cheat. For prize events, add signed run receipts or server-side replay validation before accepting scores.
