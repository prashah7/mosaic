# Luci on Hermes

This directory makes the Mosaic agent reproducible.

- `luci/SOUL.md` defines Luci's durable Hermes identity.
- `luci/skills/mosaic-project-manager/SKILL.md` defines the evidence, synthesis, memory, artifact, and action workflow.
- `Dockerfile` extends the official Hermes image and copies Mosaic evidence from a repository-root build context into `/opt/mosaic/data`.
- Canonical Mosaic memory remains in the application store; Hermes session memory is supplementary.

## Local gateway

The Luci profile must expose the Runs API on loopback with `API_SERVER_ENABLED=true` and a strong `API_SERVER_KEY`. Mosaic receives the same key as the server-only `HERMES_API_KEY` environment variable. Set Mosaic's `HERMES_WORKSPACE_PATH=/opt/mosaic` when it calls the container.

Build from the repository root:

```bash
docker build -f hermes/Dockerfile .
```

## Container requirements

Set these secrets at runtime:

- `API_SERVER_KEY`
- `OPENAI_API_KEY`

Do not expose the container directly without authentication. In production, the Mosaic server calls the container and the browser never receives either secret.
