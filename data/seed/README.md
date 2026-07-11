# Synthetic knowledge base

This directory is a fictional Q3 2026 company environment for Mosaic demonstrations. It is deliberately designed to test evidence retrieval, contradiction handling, persona relevance, and cross-initiative dependencies.

- `manifest.json` maps each initiative to its evidence sources.
- `company-okrs-q3.md` provides shared business context.
- Enterprise SSO contains meeting history, an active contradiction, decision history, tickets, stakeholder context, and an OKR slice.
- Usage Insights tests scope control: Sales requests unapproved user-level reporting while Security and Legal constrain the beta.
- Partner API v2 tests portfolio sequencing: it competes with Enterprise SSO for the same Support escalation capacity.
- `meeting-transcripts/` contains three additional one-hour cross-functional meeting transcripts that can be pasted into the Post-meeting workflow as `sourceText`.

All people, companies, dates, tickets, and project facts are synthetic.
