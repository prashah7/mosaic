# Luci on Hermes

This directory makes the Mosaic agent reproducible.

- `luci/SOUL.md` defines Luci's durable Hermes identity.
- `luci/skills/mosaic-project-manager/SKILL.md` defines the evidence, synthesis, memory, artifact, and action workflow.
- `Dockerfile` extends the official Hermes image for a hosted gateway.
- Canonical Mosaic M3 remains in the application store; Hermes session memory is supplementary.

## Local gateway

The Luci profile must expose the Runs API on loopback with `API_SERVER_ENABLED=true` and a strong `API_SERVER_KEY`. Mosaic receives the same key as the server-only `HERMES_API_KEY` environment variable.

## Container requirements

Set these secrets at runtime:

- `API_SERVER_KEY`
- `OPENAI_API_KEY`

Do not expose the container directly without authentication. In production, the Mosaic server calls the container and the browser never receives either secret.
