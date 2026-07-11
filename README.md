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

## Prototype path

1. Dashboard → **Enterprise SSO launch**
2. Open Luci run → review findings
3. Accept findings → generate remediations
4. Approve / edit / execute (simulated)
5. Run verification — audit logging stays partially resolved without an owner

All external actions are clearly marked as simulated.
