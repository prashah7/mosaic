# Team handoff checklist

Get written answers to these before integration. A short message with example
JSON is better than a meeting.

## Hermes owner

- Exact local and deployed base URLs, endpoint path, and authentication method.
- Whether Mosaic calls one Luci orchestrator or one endpoint per specialist.
- Request and response JSON for a successful task and every expected error.
- Whether completion arrives synchronously, by polling, webhook, SSE, or socket.
- Stable run, task, session, and trace identifiers.
- Timeout, retry, cancellation, and idempotency behavior.
- Which component owns parallelism: Hermes or `server/runs`.
- Cloudflare Containers availability and a non-container fallback URL.

## Frontend owner

- Which branch and route are canonical for the demo.
- The exact data required for dashboard, live run, evidence, memory, and actions.
- Whether the live timeline consumes polling, SSE, or realtime database updates.
- Loading, partial-success, failed-task, empty, and cancelled states.
- One fixture per screen using types imported from `contracts/`.

## API-contract owner

- One source of truth for public types: TypeScript, OpenAPI, or JSON Schema.
- Start-run, get-run, list-events, cancel-run, and approve-action contracts.
- Event ordering, replay cursor, terminal states, and error envelope.
- Idempotency-key and authentication headers.
- Persistence choice: D1 or Convex, never both as canonical state.
- Who writes contract fixtures and who signs off on breaking changes.

## Team decision required today

1. Pick `main` as the integration base and merge UI work into it by pull request.
2. Pick D1 or managed Convex.
3. Pick the live-update transport.
4. Decide where specialist fan-out runs.
5. Name one owner for the final end-to-end demo and deployment credentials.
