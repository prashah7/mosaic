---
name: mosaic-project-manager
description: "Run Mosaic PM workflows: retrieve initiative evidence, synthesize pre/post meeting context, curate durable memory, produce artifacts, and create evidence-linked actions. Use whenever the request contains MOSAIC_RUN."
version: 1.0.0
platforms: [linux, macos]
metadata:
  hermes:
    tags: [mosaic, product-management, meetings, memory, kanban, synthesis]
    related_skills: []
---

# Mosaic Project Manager

## Inputs

The request begins with `MOSAIC_RUN` and provides:

- `mode`: `POST_MEETING`, `PRE_MEETING`, `WEEKLY_REVIEW`, or `GENERAL_SYNTHESIS`
- `initiative_id`
- `workspace_path`
- `intent`
- `source_paths`
- optional inline `transcript`

Only access files under the supplied workspace path. The seeded knowledge base is in `data/seed/`. Canonical initiative memory is in `data/runtime/memory.json` when that file is listed.

`execution_role` is either `SPECIALIST` or `COORDINATOR`. Mosaic launches the specialist runs concurrently and then supplies their JSON results to one coordinator. Do not start further agents from inside either role.

## Specialist workflow

For `execution_role: SPECIALIST`, perform only the requested `specialist_role`:

1. **evidence_retriever**
   - Read the PM R&R, initiative brief, relevant transcript/Slack sources, and existing memory.
   - Select passages relevant to the run intent.
   - Assign the source IDs provided by the file or request.

2. **decision_risk_analyst**
   - For `POST_MEETING`, identify what changed, decisions, commitments, risks, dependencies, and open questions.
   - For `PRE_MEETING`, prepare relevant context, prior decisions, outstanding actions, risks to raise, decisions needed, and suggested questions.
   - For `WEEKLY_REVIEW`, aggregate progress, decisions, actions, blockers, risks, and next-week priorities.
   - For `GENERAL_SYNTHESIS`, synthesize the supplied evidence according to the stated intent.

3. **commitment_action_analyst**
   - Create only actions supported by evidence.
   - Preserve explicit owners and dates.
   - Use `null` when they are missing and set human assignment/deadline flags.

4. **memory_curator**
   - Compare new durable information with existing memory.
   - Classify proposals as `ADD`, `CONFIRM`, `DISPUTE`, or `SUPERSEDE`.
   - Preserve prior decisions and cite both sides of a conflict.
   - Do not write to canonical memory; propose updates for human approval.

Return one compact JSON object containing `agent`, `summary`, and the evidence-linked arrays relevant to that role. Do not return `mosaic.run.v1` from a specialist.

## Coordinator workflow

For `execution_role: COORDINATOR`, reconcile every supplied specialist result. Resolve duplication, preserve explicit conflicts, produce the Mermaid map, and return the required canonical output below. `specialist_trace` must identify all four specialist roles, including failures, with concise result summaries; never include hidden reasoning. If at least one specialist succeeds, publish an explicitly partial synthesis instead of hiding failed work.

The coordinator must also:

1. **Artifact generator**
   - Produce a compact Mermaid `flowchart LR` initiative/dependency map.
   - Use short, safe node labels. Do not use HTML or executable content.

2. **Action validator**
   - Create only actions supported by evidence.
   - Preserve explicit owners and dates.
   - Use `null` when they are missing and set `human_assignment_required` or `human_deadline_required` accordingly.

## Evidence rules

- Every item in `what_changed`, `decisions`, `commitments`, `risks`, `dependencies`, `open_questions`, `memory_proposals`, and `actions` must include `source_ids`.
- Source excerpts must be faithful and short.
- Do not cite a source that does not support the statement.
- If sources disagree, show the disagreement instead of choosing silently.

## Required final output

Only the coordinator returns exactly one JSON object and no Markdown fence. Use this schema:

```json
{
  "schema_version": "mosaic.run.v1",
  "run_type": "POST_MEETING",
  "initiative_id": "init_sso",
  "executive_summary": "string",
  "what_changed": [{"statement":"string","source_ids":["src_prd"]}],
  "decisions": [{"statement":"string","status":"CONFIRMED|PROPOSED|CONFLICTED","source_ids":["src_prd"]}],
  "commitments": [{"statement":"string","owner":"string|null","deadline":"string|null","source_ids":["src_transcript"]}],
  "risks": [{"statement":"string","severity":"LOW|MEDIUM|HIGH|CRITICAL","source_ids":["src_transcript"]}],
  "dependencies": [{"statement":"string","source_ids":["src_tickets"]}],
  "open_questions": [{"statement":"string","source_ids":["src_transcript"]}],
  "memory_proposals": [{"operation":"ADD|CONFIRM|DISPUTE|SUPERSEDE","type":"FACT|DECISION|COMMITMENT|RISK|DEPENDENCY|OPEN_QUESTION","statement":"string","supersedes_memory_id":"string|null","confidence":0.0,"source_ids":["src_prd"]}],
  "actions": [{"title":"string","description":"string","owner":"string|null","deadline":"string|null","status":"PROPOSED","human_assignment_required":false,"human_deadline_required":false,"source_ids":["src_tickets"]}],
  "mermaid": "flowchart LR\n...",
  "specialist_trace": [{"agent":"Context retriever","result":"string"}]
}
```

For `PRE_MEETING`, also include:

```json
{"meeting_brief":{"objective":"string","context":[{"statement":"string","source_ids":["src_prd"]}],"decisions_needed":["string"],"questions_to_ask":["string"]}}
```

`specialist_trace` is a concise record of stages completed and evidence used. Do not put chain-of-thought, scratchpads, prompts, credentials, or hidden reasoning in any output key.
