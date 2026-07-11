# Multi-agent evals

This directory contains deterministic contract evals for Mosaic's orchestration layer. They do not call a model or require credentials.

## What existed on `origin/main`

At commit `21a53d9` (`Add synthetic initiative selector for Luci runs`), `origin/main` had **no eval harness, `evals/` directory, scorer, benchmark, or multi-agent fixture**. Git history also contains no deleted eval assets. The only test was `tests/rendered-html.test.mjs`; it checked server-rendered copy, seed-file contents, and that the Hermes API key remained server-side. It did not measure model output quality or agent orchestration.

The useful assets ported conceptually from `main` are its seeded source IDs and the Luci output invariants: `MOSAIC_RUN`, `mosaic.run.v1`, evidence citations, proposed-only actions, null-safe owner/deadline handling, and server-side Hermes credentials. No test file from `main` was copied because its render harness targets the old Vinext application.

## Deterministic scenarios

- `happy-path.json`: four specialists execute, at least two overlap, and an artifact-generating coordinator consumes every result.
- `partial-success.json`: one specialist fails, successful results are still aggregated, and degradation is explicit.
- `failed-run.json`: no usable specialist result exists, coordination does not run, and no misleading synthesis is published.

The evaluator checks specialist role uniqueness and coverage, wall-clock overlap, coordinator inputs, failed-agent reporting, all required `mosaic.run.v1` fields, citation coverage and source validity, successful-agent trace coverage, and explicit success/partial/fatal semantics.

Run directly:

```bash
node --test tests/multi-agent-eval.test.mjs
```
