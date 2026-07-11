# Legitimate failure and degraded eval cases

These cases are intentionally not “successful synthesis” tests. They verify that Hermes recognizes when it cannot produce a trustworthy result and responds safely.

Each case contains:

- `failure_mode` — why the workflow cannot complete normally
- `input` — the deliberately bad or incomplete run input
- `expected_behavior` — what a correct agent should do
- `forbidden_behavior` — unsafe shortcuts that should fail the eval
- `expected_status` — `BLOCKED`, `DEGRADED`, `PARTIAL`, or `FAILED`

The correct answer is not always a JSON synthesis. For missing or unusable evidence, the agent should explain the blocker and request the smallest useful correction.
