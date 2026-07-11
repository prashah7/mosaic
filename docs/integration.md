# Integrated runtime

```text
ui-prototype
  -> Next.js initiative API
  -> four parallel Hermes specialist runs
  -> one Hermes coordinator run
  -> Convex run + ordered event persistence
  -> one-second UI polling
```

## Ownership

- The UI and public API routes come from `ui-prototype`.
- Mosaic owns fan-out, polling, cancellation, and aggregation sequencing.
- Hermes executes four isolated specialists and one final coordinator. Agents
  do not recursively spawn more agents.
- Convex owns durable run snapshots, idempotency, and user-safe lifecycle
  events. The process-local store is a development fallback only.
- The Next.js API owns gateway secrets, status normalization, output parsing,
  cancellation, and materializing completed artifacts/actions/memory.

## Runtime sequence

1. UI sends an immutable run request and idempotency key.
2. API records `CREATED` locally and in Convex.
3. API starts four authenticated Hermes specialist runs concurrently and stores
   each child trace ID.
4. UI polls the Mosaic run endpoint once per second.
5. API polls every specialist, surfaces partial failures, and starts one
   coordinator when at least one usable specialist output exists.
6. API polls the coordinator, validates `mosaic.run.v1`, and materializes review
   records while persisting child/coordinator state and events to Convex.
7. UI renders the real trace and result; no client timer invents specialist work.

## Evaluation

`npm run eval` checks real interval overlap, specialist-role coverage,
coordinator completeness, citation coverage, source validity, and explicit
success, partial-success, and fatal-failure semantics. The audit found no eval
harness on `origin/main`; see `evals/README.md` for the exact comparison.

## Deployment gates

- Configure `CONVEX_URL` and deploy the functions in `convex/`.
- Configure `HERMES_API_KEY` and a Hermes-readable evidence workspace.
- Set `MOSAIC_DEMO_FALLBACK=false` outside local/demo environments.
- Put the Hermes container behind a private Cloudflare Worker-to-Container
  binding or an authenticated HTTPS gateway.

## Cloudflare Workers

The Next.js application is configured for the official OpenNext Cloudflare
adapter in `open-next.config.ts` and `wrangler.jsonc`.

```bash
npm run preview:cloudflare
npm run deploy:cloudflare
```

Set `CONVEX_URL`, `CONVEX_AUTH_TOKEN`, `HERMES_BASE_URL`, and
`HERMES_API_KEY` as Cloudflare build variables or secrets. The browser never
receives the Hermes or Convex credentials.
