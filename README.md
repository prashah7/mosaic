# Mosaic

Functional frontend prototype for **Mosaic** — a multi-agent initiative coordination platform — with **Luci** as the primary orchestration agent.

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
- Seeded Enterprise SSO fixtures (no backend)

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The API store is process-local and resets when the server restarts. It is intentionally shaped so the routes can later swap in a database and Hermes orchestration.

## API surface

- `GET /api/health`
- `GET /api/demo/workspace`
- `GET|POST /api/initiatives`
- `GET /api/initiatives/:initiativeId`
- `GET /api/initiatives/:initiativeId/sources`
- `GET|POST /api/initiatives/:initiativeId/runs`
- `GET /api/initiatives/:initiativeId/runs/:runId`
- `GET|PATCH /api/initiatives/:initiativeId/actions` (`PATCH` uses `?actionId=`)
- `GET /api/initiatives/:initiativeId/artifacts`
- `GET /api/initiatives/:initiativeId/memory`

Create a run with:

```json
{
  "type": "POST_MEETING",
  "intent": "Synthesize the payments reliability meeting",
  "transcript": "Jon confirmed the patch is ready for staging..."
}
```

Runs return a structured synthesis, cited source IDs, a Mermaid mind map, proposed actions, and proposed durable-memory updates.

When configured, creating a run also calls the Convex mutation at `CONVEX_CREATE_JOB_FUNCTION` (default: `jobs:create`) through `${CONVEX_URL}/api/mutation`. Set `CONVEX_URL` and optionally `CONVEX_AUTH_TOKEN`; the response includes `convexJob.status` as `created`, `failed`, or `not_configured`.

## Prototype path

1. Dashboard → **Enterprise SSO launch**
2. Open Luci run → review findings
3. Accept findings → generate remediations
4. Approve / edit / execute (simulated)
5. Run verification — audit logging stays partially resolved without an owner

All external actions are clearly marked as simulated.
