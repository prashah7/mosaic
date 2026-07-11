# Mosaic Convex backend

Convex is the durable system of record for Mosaic run state and user-safe run
events. Hermes remains the agent runtime; Mosaic starts and polls one Hermes
run, then mirrors each lifecycle transition into Convex.

## Local setup

1. Run `npm run convex:dev` and follow the Convex deployment prompt.
2. Put the generated deployment URL in root `.env.local` as `CONVEX_URL`.
3. Set `CONVEX_AUTH_TOKEN` only when the deployment requires a server identity.
4. Run `npm run dev` in a second terminal.

The Next.js API keeps an in-memory fallback for local fixture mode, but deployed
orchestration must configure Convex and set `MOSAIC_DEMO_FALLBACK=false`.

## Functions

- `runs:upsert` stores the canonical run snapshot and deduplicates immutable
  requests by idempotency key.
- `runs:get` and `runs:listForInitiative` read run state.
- `runEvents:append` stores ordered, user-safe lifecycle events.
- `runEvents:list` supports cursor-style polling with an `after` sequence.
