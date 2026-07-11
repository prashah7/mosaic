# Mosaic

Integrated **Mosaic** multi-agent initiative coordination demo with **Luci on Hermes**, Convex-backed run state, and a live Next.js workspace.

Inspired by dense operations-console UX (dark surfaces, metric grids, observable agent flows) and scoped to the hackathon MVP loop from the PRD:

1. Dashboard portfolio health
2. Initiative command center + evidence
3. Observable Luci run
4. Finding review → remediation approval → simulated GitHub/Mosaic execution
5. Independent verification with unresolved ownership preserved

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS v4
- Lucide icons
- Hermes Runs API adapter and reproducible Luci profile
- Four parallel specialist agents plus one coordinator agent
- Convex run and ordered-event persistence
- Seeded Enterprise SSO evidence plus deterministic local fallback

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With `MOSAIC_DEMO_FALLBACK=true`, the full run lifecycle works without external credentials. For the real runtime, configure Hermes and Convex in `.env.local`; see [docs/integration.md](docs/integration.md) and [hermes/README.md](hermes/README.md).

The sidebar **Settings** page can update credentials for the current single-user demo process. It never returns entered secrets. Production mutation is disabled unless `ALLOW_RUNTIME_SETTINGS=true`; prefer platform-managed secrets for any shared deployment.

Run snapshots and lifecycle events are persisted to Convex when `CONVEX_URL` is configured. The process-local store remains the development fallback and holds materialized actions, artifacts, and memory during the current process.

## API surface

- `GET /api/health`
- `GET /api/demo/workspace`
- `GET|POST /api/initiatives`
- `GET /api/initiatives/:initiativeId`
- `GET /api/initiatives/:initiativeId/sources`
- `GET|POST /api/initiatives/:initiativeId/runs`
- `GET /api/initiatives/:initiativeId/runs/:runId`
- `POST /api/initiatives/:initiativeId/runs/:runId/cancel`
- `GET|PATCH /api/initiatives/:initiativeId/actions` (`PATCH` uses `?actionId=`)
- `GET /api/initiatives/:initiativeId/artifacts`
- `GET /api/initiatives/:initiativeId/memory`

Create a run with an `Idempotency-Key` header:

```bash
curl -X POST http://localhost:3000/api/initiatives/init_sso/runs \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-post-meeting-1' \
  -d '{
    "type": "POST_MEETING",
    "intent": "Synthesize the architecture meeting",
    "sourceIds": ["src_transcript", "src_slack"]
  }'
```

The API starts four specialist Hermes runs concurrently, then starts one coordinator run after the specialists settle. Poll the returned Mosaic run URL once per second until `COMPLETED`, `FAILED`, or `CANCELLED`. A completed `mosaic.run.v1` output materializes cited synthesis, a Mermaid mind map, proposed actions, and memory proposals.

Run the deterministic orchestration and output-quality evals with `npm run eval`.

Deploy Convex functions with `npm run convex:deploy`. Hermes is packaged from the repository root with `docker build -f hermes/Dockerfile .`.

Preview the Next.js app in Cloudflare's `workerd` runtime with `npm run preview:cloudflare`, then deploy it with `npm run deploy:cloudflare`. Configure production secrets with Wrangler or the Cloudflare dashboard; do not commit them to `wrangler.jsonc`.

## Prototype path

1. Dashboard → **Enterprise SSO launch**
2. Open Luci run → review findings
3. Accept findings → generate remediations
4. Approve / edit / execute (simulated)
5. Run verification — audit logging stays partially resolved without an owner

All external actions are clearly marked as simulated.
