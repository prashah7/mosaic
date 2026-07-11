# Shared contracts

`runs.ts` is the browser/API/runtime boundary for Mosaic orchestration. Both the
UI model in `lib/types.ts` and the API model in `src/lib/types.ts` reuse these
run types so lifecycle changes cannot drift independently.

Contract rules:

- Additive changes are preferred during the buildathon.
- Hermes-specific wire fields stay in `src/lib/hermes.ts`.
- Convex document IDs never replace Mosaic `run.id` or Hermes `run_id`.
- Hermes `run_id` is stored as the trace ID.
- Events contain user-safe summaries only, never prompts or hidden reasoning.
- Terminal statuses are `COMPLETED`, `FAILED`, and `CANCELLED`.
