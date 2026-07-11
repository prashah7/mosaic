# Mosaic

Mosaic is an evidence-backed initiative workspace for product managers. Luci,
its Hermes-powered agent, prepares meeting briefs, synthesizes changes, curates
durable initiative memory, and proposes follow-up work with source citations.

## Prerequisites

- Node.js `>=22.13.0`

## Quick start

```bash
npm install
npm run dev
npm run build
```

The app runs on the Cloudflare-compatible vinext runtime. Without Hermes
credentials, the API returns a deterministic fixture run so the UI and
integration contract remain testable.

## Project boundaries

- `app/`: Next.js UI and thin HTTP route handlers
- `contracts/`: shared, versioned request, response, and event types
- `server/hermes/`: the only code that knows the Hermes transport
- `server/runs/`: run planning, parallel specialist execution, and fallback
- `server/observability/`: user-safe run events and structured server logs
- `db/`: canonical persistence schema and repositories
- `worker/`: Cloudflare Worker entry point and platform bindings
- `data/seed/`: synthetic demo evidence
- `docs/`: architecture decisions and teammate handoff notes

Read `docs/team-handoff.md` before changing a cross-team boundary.

## Environment

Copy the values described in `.env.example` into a local `.env` file. Secrets
stay server-side and must never be added to `NEXT_PUBLIC_*` variables.

## Workspace authentication

OpenAI workspace sites can read the current user's email from the
`oai-authenticated-user-email` request header. The optional helpers in
`app/chatgpt-auth.ts` support Sign in with ChatGPT when the final demo needs
identity-aware writes.

## Commands

- `npm run dev`: start local development
- `npm run build`: verify the Cloudflare-compatible build
- `npm test`: build and verify the rendered workspace and API boundary
- `npm run lint`: run static checks
- `npm run db:generate`: generate Drizzle migrations after schema changes
