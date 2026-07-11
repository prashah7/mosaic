# Mosaic integration architecture

## Request path

```text
Browser
  -> app/api/luci (validation and HTTP status only)
  -> server/runs (run plan and parallel specialist execution)
  -> server/hermes (runtime transport)
  -> Hermes

Every transition emits user-safe events through server/observability.
Canonical records eventually persist through db repositories.
```

Context retrieval runs first. The synthesizer, artifact generator, memory
curator, and action manager then run concurrently with `Promise.allSettled` so
one specialist failure produces a degraded run instead of discarding every
successful result.

## Ownership boundaries

| Surface | Owner | Rule |
| --- | --- | --- |
| `app/` and `components/` | Frontend | Consume contracts; do not call Hermes directly. |
| `contracts/` | API contracts | Keep browser-facing shapes backward compatible. |
| `server/hermes/` | Hermes integration | Runtime-specific details stay inside the adapter. |
| `server/runs/` | Integration/parallelism | Own task dependency graph, retries, and degradation. |
| `server/observability/` | Integration/observability | No prompts, secrets, or hidden reasoning in events. |
| `db/` | API/persistence | One canonical store; do not dual-write D1 and Convex. |
| `worker/` and `.openai/` | Cloudflare deployment | Bindings and platform entry point only. |

## Deployment decision

The current `main` branch is a Cloudflare Sites/vinext application and has a D1
integration surface, but D1 is not enabled. The team must choose exactly one
canonical application database:

- Use D1 for the shortest Cloudflare-native path.
- Use managed Convex only when Convex is a required sponsor technology or its
  reactive subscriptions are essential to the demo.

Do not self-host `get-convex/convex-backend` during the hackathon.
