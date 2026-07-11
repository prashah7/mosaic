# Mosaic integration handoff

This document records the verified API and orchestration contract for the
current build. Items under **Production decisions** remain unresolved.

## Runtime endpoints

| Topic | Current answer |
| --- | --- |
| Local Mosaic API | `http://localhost:3001/api/luci` |
| Local Hermes gateway | `http://127.0.0.1:8642` |
| Start Hermes run | `POST /v1/runs` |
| Read Hermes run | `GET /v1/runs/{run_id}` |
| Stop Hermes run | `POST /v1/runs/{run_id}/stop` |
| Gateway authentication | `Authorization: Bearer <API_SERVER_KEY>` |
| Session grouping | `X-Hermes-Session-Key: mosaic:initiative:<initiative_id>` |
| Deployed Mosaic URL | Not provisioned |
| Deployed Hermes URL | Not provisioned |

The browser never receives `API_SERVER_KEY`. Mosaic server code is the only
caller of the Hermes gateway.

## Orchestration ownership

Mosaic submits one Luci orchestrator run to Hermes. Luci owns the logical
specialist sequence:

```text
context retrieval
  -> synthesis
  -> artifact generation
  -> memory curation
  -> action generation
```

Mosaic must not submit one Hermes run per specialist. Hermes may parallelize
safe internal reads, but specialist fan-out is not a Mosaic API responsibility.

## Start-run contract

Mosaic sends:

```json
{
  "input": "MOSAIC_RUN\nmode: POST_MEETING\ninitiative_id: enterprise-sso\nworkspace_path: <absolute-hermes-readable-mosaic-path>\nsource_paths:\n- data/seed/pm-role.md\n- data/seed/enterprise-sso-prd.md\n- data/seed/slack-thread.json\n- data/runtime/memory.json\n- data/seed/identity-architecture-review.md\nintent: Update project state, propose memory changes, and create follow-up actions.",
  "instructions": "Follow the MOSAIC_RUN contract and use the mosaic-project-manager skill. Return the final JSON directly; do not call execute_code or mutating tools.",
  "session_id": "run-<timestamp>"
}
```

Hermes immediately returns:

```json
{
  "run_id": "run_3a06c1bd4c4144b4a8ad82fbe23176f0",
  "status": "started"
}
```

`workspace_path` must exist from the Hermes process or container. A container
deployment therefore needs the Mosaic evidence mounted or copied to that path.

## Completion contract

Run completion is asynchronous:

1. Mosaic submits `POST /v1/runs`.
2. Hermes returns `run_id` immediately.
3. Mosaic polls `GET /v1/runs/{run_id}` once per second.
4. Mosaic parses `output` only after `status` is `completed`.

Example completed response:

```json
{
  "object": "hermes.run",
  "run_id": "run_...",
  "status": "completed",
  "session_id": "run-<timestamp>",
  "model": "luci",
  "output": "{\"schema_version\":\"mosaic.run.v1\",\"actions\":[]}",
  "usage": {
    "input_tokens": 48930,
    "output_tokens": 3964,
    "total_tokens": 52894
  }
}
```

The `output` string contains schema-valid `mosaic.run.v1` JSON with:

- `run_type` and `initiative_id`
- `executive_summary`
- `what_changed`, `decisions`, and `commitments`
- `risks`, `dependencies`, and `open_questions`
- `memory_proposals` and `actions`
- `mermaid`
- user-safe `specialist_trace`

Do not expose prompts, scratchpads, credentials, or hidden reasoning.

## Run states

Mosaic must handle:

- `started`
- `running`
- `completed`
- `failed`
- `cancelled`
- `waiting_for_approval`

The current instructions prohibit mutating tools, so
`waiting_for_approval` should be uncommon but remains a valid state.

Hermes `run_id` is the canonical trace identifier. Hermes does not expose task
IDs. If task-level tracing is required, Mosaic should derive stable logical
task indexes from `specialist_trace` after completion.

## Gateway errors

Hermes returns structured errors:

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

```json
{
  "error": {
    "message": "Run not found: not-a-real-run",
    "type": "invalid_request_error",
    "code": "run_not_found"
  }
}
```

Mosaic should preserve the stable `code` in its server response while replacing
gateway details with a user-safe message where necessary.

## Reliability status

| Concern | Current behavior | Required production behavior |
| --- | --- | --- |
| Submit timeout | 8 seconds | Return typed `gateway_timeout` |
| Poll timeout | 90 seconds in the browser | Persist the pending run and continue server-side |
| Retry | None | Retry only safe transport failures with a cap |
| Cancellation | Hermes stop endpoint exists | Add a Mosaic API wrapper and UI command |
| Idempotency | New timestamp session per click | Persist a key for each immutable input snapshot |
| Trace ID | Hermes `run_id` | Store it on the Mosaic run record |
| Demo fallback | Returns fixture when Hermes is unavailable | Disable fixtures in deployed orchestration |

## Cloudflare target

Cloudflare Containers are generally available and require a Workers Paid plan.
The target shape is:

```text
Mosaic Worker `/api/luci`
  -> private Worker-to-Container binding
  -> Hermes gateway on container port 8642
```

Do not expose the Hermes container directly. If Containers are unavailable, run
the existing `hermes/Dockerfile` on a separate HTTPS host and keep Bearer
authentication between Mosaic and that gateway.

- [Cloudflare Containers overview](https://developers.cloudflare.com/containers/)
- [Cloudflare Containers GA announcement](https://developers.cloudflare.com/changelog/post/2026-04-13-containers-sandbox-ga/)

## Production decisions

The team still needs explicit owners and answers for:

1. Mosaic API authentication and workspace authorization.
2. Canonical persistence: D1 or Convex.
3. Server-side run polling and event persistence.
4. Retry limits, timeout values, and partial-success semantics.
5. Idempotency-key generation and retention.
6. Mosaic cancellation endpoint and UI behavior.
7. OpenAPI or JSON Schema as the public contract source.
8. Dedicated approve/reject action endpoint.
9. Cloudflare Containers versus a separately hosted Hermes gateway.
10. Final deployment credentials and end-to-end demo owner.
