# Enterprise SSO Hermes eval case

This is one post-meeting evaluation scenario for the Enterprise SSO initiative. It is deliberately dense enough to test evidence retrieval, contradiction handling, explicit versus implied commitments, missing ownership, security gates, and cross-functional dependencies.

## Files

- `case.json` — input contract, source map, edge cases, and scoring targets
- `transcript.md` — the one-hour meeting source
- `gold-luci-output.json` — expected Luci artifact using the Hermes `mosaic.run.v1` schema
- `rubric.json` — grading dimensions and pass/fail rules
- `grader-report.json` — independent grader output
- `failure-cases/` — legitimate blocked, degraded, partial, failed, and zero-action cases

## Running it through Hermes

Use the `POST_MEETING` mode with initiative ID `enterprise-sso`. Include the source paths in `case.json` and paste `transcript.md` as the meeting source if the workflow is running through the UI/API.

The gold output is a semantic reference, not an exact string match. Grade claims, citations, classifications, owners, deadlines, and safety behavior.

The failure cases should be scored for safe behavior, not for producing a complete synthesis. A correct result may be a blocked run, a partial result with warnings, a conflict requiring human confirmation, a failed run, or a completed run with zero actions.
