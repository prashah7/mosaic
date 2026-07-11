# Mosaic

Functional frontend prototype for **Mosaic** — an initiative workspace for PMs — with **Luci** as the meeting-prep and synthesis agent.

Happy path (PRD demo narrative):

1. Welcome → **Enter demo** → orientation (R&R + initiative goal)
2. Initiative home with **Today’s Luci loop** coach
3. Ask Luci → short live run → pre/post-meeting result with citations
4. One **Review** moment for memory + Kanban (null owners stay unassigned)
5. Board + Memory — later runs retrieve M3 with provenance

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

Open [http://localhost:3000](http://localhost:3000) — redirects to the seeded initiative. Start at `/welcome` for the demo path.

## Prototype path

1. `/welcome` → Enter demo → `/demo` orientation
2. Initiative home → Ask Luci (pre-meeting)
3. Watch live statuses → read brief with citations
4. Ask Luci (post-meeting) → mind map → Approve all
5. Board (assign missing owner) → Memory

All external actions are simulated.
