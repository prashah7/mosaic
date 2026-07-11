# Mosaic Product Requirements Document

**Version:** 1.0

**Status:** Buildathon MVP specification

**Product:** Mosaic

**Primary agent:** Luci

**Primary user:** Product Manager

**Category:** AI-powered project management and initiative coordination

**Agent runtime:** Hermes

**Deployment target:** Cloudflare, after local validation

---

## 1. Executive summary

Mosaic is an AI-powered project management platform for Product Managers. Its primary agent, **Luci**, helps a PM understand and advance a product initiative across meetings, documents, Slack discussions, decisions, dependencies, and follow-up work.

Luci uses the PM's role and responsibilities, the initiative goal, company knowledge, previous meetings, and accumulated project memory to:

- Prepare the PM before a meeting.
- Synthesize what happened after a meeting.
- Identify decisions, commitments, risks, dependencies, and open questions.
- Create persona-relevant visual and operational artifacts.
- Propose and track follow-up actions on a Kanban board.
- Maintain durable initiative memory across multiple runs.
- Produce weekly progress and alignment summaries.

Mosaic is the platform. Luci is the user-facing agent inside Mosaic. Hermes runs Luci and her specialist workflows.

The MVP proves that Luci does more than summarize a transcript: she remembers relevant project context across runs, connects new evidence to prior decisions, updates the PM's mental model, and proposes the next actions required to move the initiative forward.

---

## 2. Product vision

### 2.1 Long-term vision

Mosaic becomes the persistent coordination and memory layer for complex company initiatives.

Company knowledge is usually fragmented across documents, meetings, chat threads, tickets, and individual memory. Mosaic continuously turns that fragmented information into a current, evidence-backed understanding of the project.

The long-term product can support multiple personas, including Product Managers, Engineering Managers, program leaders, auditors, and executives. The MVP serves only Product Managers.

### 2.2 MVP vision

For one Product Manager and one seeded initiative, the MVP answers:

> What do I need to know before this meeting, what changed afterward, and what should happen next to keep the initiative moving toward its goal?

### 2.3 Positioning

> Mosaic is an AI-powered project management workspace for Product Managers. Its agent, Luci, prepares PMs for meetings, synthesizes outcomes, creates visual and operational artifacts, tracks follow-ups, and maintains durable project memory across every interaction.

---

## 3. Target user

### 3.1 Primary persona

A Product Manager at a B2B software company who:

- Owns a product initiative or outcome.
- Writes briefs and PRDs.
- Coordinates product, engineering, design, go-to-market, legal, finance, or customer teams.
- Runs recurring meetings.
- Tracks decisions, risks, dependencies, and follow-ups.
- Needs to keep stakeholders aligned over weeks or months.

### 3.2 PM role and responsibility profile

Mosaic stores an R&R profile for the PM containing:

- Role and title.
- Responsibilities.
- Scope and owned product areas.
- Current goals.
- Decision authority.
- Key stakeholders.
- Owned versus influenced work.
- Preferred output style and artifact types.

Luci uses this profile to determine what context is relevant, which risks matter to the PM, and how outputs should be framed.

### 3.3 Core user problem

The PM repeatedly reconstructs project state from scattered sources. Important information is lost between meetings, decisions become disconnected from actions, dependencies surface late, and follow-ups are difficult to close.

Existing meeting-summary tools capture what was said. They generally do not maintain an evolving, goal-oriented model of the initiative or use that model to prepare the next meeting and drive follow-through.

---

## 4. Product principles

### 4.1 Goal-oriented

Every Luci run must serve an initiative goal. Outputs should explain how new information affects that goal.

### 4.2 Evidence-backed

Important claims, decisions, risks, and recommendations must cite their source. Luci distinguishes confirmed facts, assumptions, inferences, and open questions.

### 4.3 Memory is curated, not accumulated blindly

Not every sentence becomes long-term memory. Luci promotes durable information and preserves provenance, confidence, and supersession history.

### 4.4 Persona-aware

Outputs are generated for the PM's role, responsibilities, scope, and current intent.

### 4.5 Human control

Luci proposes work. The PM approves external actions and remains responsible for scope, ownership, priority, deadlines, and commitments.

### 4.6 No invented owners or commitments

When an owner or deadline is not supported by evidence, Luci displays **Human assignment required** or **Human deadline required**.

### 4.7 Observable agent work

Mosaic shows agent name, task, status, duration, inputs, source references, structured result summary, and errors. It does not expose hidden reasoning, scratchpads, secrets, or provider credentials.

### 4.8 Useful artifacts over decorative output

Every artifact must help the PM understand, decide, communicate, or act.

---

## 5. Core mental model

```text
Workspace
├── PM persona and R&R
├── Company knowledge base
└── Initiative / goal
    ├── Durable goal memory (M3)
    ├── Run 1
    │   ├── Run memory (M2)
    │   ├── Specialist tasks and working memory (M1)
    │   ├── Evidence
    │   ├── Synthesis
    │   ├── Artifacts
    │   └── Actions
    ├── Run 2
    └── Run N
```

### 5.1 Workspace

A private container for the user profile, R&R, company knowledge, initiatives, runs, artifacts, and actions.

### 5.2 Initiative or goal

A multi-week or multi-month business or product outcome. An initiative contains:

- Objective.
- Description.
- Success metrics.
- Target date.
- Product stage.
- Stakeholders.
- Current status and health.
- Durable memory.
- Runs, artifacts, and actions.

### 5.3 Run

A run is one invocation of Luci against an initiative. A run has an intent, selected or retrieved evidence, agent tasks, outputs, artifacts, proposed memory updates, and actions.

MVP run types:

- `PRE_MEETING`
- `POST_MEETING`
- `WEEKLY_REVIEW`
- `GENERAL_SYNTHESIS`

Runs are sequential for an initiative in the MVP. Multiple historical runs are preserved.

### 5.4 Luci

Luci is the user-facing orchestration agent. She understands the user's intent, retrieves relevant context, invokes specialist workflows, consolidates their outputs, proposes durable memory updates, and presents the final result.

---

## 6. Memory architecture

Memory is Mosaic's primary technical and product differentiator.

### 6.1 M1: specialist working memory

Temporary context used by one specialist task during a run.

Examples:

- Extracted transcript passages.
- Draft synthesis.
- Intermediate artifact structure.
- Candidate action items.

M1 is not automatically treated as project truth.

### 6.2 M2: shared run memory

The normalized state shared across specialist tasks within one run.

It may contain:

- Run intent.
- Retrieved evidence.
- Extracted entities and facts.
- Decisions and commitments.
- Risks and dependencies.
- Open questions.
- Candidate actions.
- Candidate M3 updates.

M2 is frozen with the completed run so the result remains auditable.

### 6.3 M3: durable initiative memory

Curated long-term memory shared across runs for one initiative.

M3 contains:

- Current goal and success metrics.
- Durable facts.
- Decisions and decision status.
- Superseded decisions.
- Stakeholders and established responsibilities.
- Commitments and their state.
- Risks and dependencies.
- Open questions.
- Project vocabulary.
- Important artifacts.
- Current initiative narrative and health.

### 6.4 Memory record requirements

Each durable memory record includes:

- Type.
- Statement or structured value.
- Initiative ID.
- Source evidence IDs.
- Source run ID.
- Confidence.
- Status: proposed, confirmed, disputed, or superseded.
- First-seen timestamp.
- Last-confirmed timestamp.
- Superseded-by reference when applicable.

### 6.5 Memory promotion rules

Luci proposes an M3 update when new evidence contains a durable:

- Decision.
- Commitment.
- Goal or metric change.
- Stakeholder responsibility.
- Risk or dependency.
- Confirmed project fact.
- Resolution of an open question.

Temporary discussion, repetition, unsupported opinion, and conversational detail remain in M2 unless the user explicitly promotes them.

### 6.6 Contradiction and supersession

When new evidence conflicts with M3, Luci must not silently overwrite memory. She:

1. Shows the conflicting sources.
2. Classifies the conflict as unresolved or likely supersession.
3. Requests confirmation when product intent is ambiguous.
4. Preserves the prior record.
5. Links an approved replacement with `supersededBy`.

### 6.7 Retrieval

Before a run, Luci retrieves context using:

- Initiative match.
- Run intent.
- PM R&R relevance.
- Source type.
- Recency.
- Semantic relevance.
- Memory status and confidence.

Retrieved answers and outputs retain citations to their original evidence.

---

## 7. Knowledge base and synthetic data

### 7.1 MVP knowledge sources

The MVP uses a synthetic company knowledge base stored locally or in the application database. It includes:

- PM R&R document in Markdown.
- Initiative brief in Markdown.
- PRD in Markdown or PDF.
- Previous meeting transcript.
- Current meeting transcript.
- Slack thread fixture in JSON.
- Ticket fixture in JSON or Markdown.
- Decision log.

The dataset intentionally includes decisions, dependencies, commitments, and at least one contradiction across runs.

### 7.2 Input support

For the MVP, the user can:

- Paste text.
- Upload Markdown.
- Upload PDF.
- Load seeded Slack JSON.
- Load seeded ticket data.

Live Google Drive, Slack, Jira, Linear, Notion, Confluence, and calendar integrations are excluded from the first build.

### 7.3 Retrieval behavior

Luci searches the synthetic KB and M3 before each run. The UI shows:

- Which sources were retrieved.
- Relevant excerpts.
- Why they were used when helpful.
- Source citations in generated outputs.

---

## 8. Core workflows

### 8.1 Create an account and workspace

The PM signs up with email and receives one private workspace.

For a buildathon shortcut, authentication may be replaced by a seeded demo user if required to protect the core vertical slice.

### 8.2 Create an initiative

Required inputs:

- Initiative name.
- Intent or objective.
- At least one success metric.

Optional inputs:

- Description.
- Target date.
- Product stage.
- Stakeholders.
- Initial documents.

### 8.3 Pre-meeting run

The PM selects an initiative, provides a meeting objective or agenda, and invokes Luci.

Luci retrieves the R&R, initiative memory, relevant prior runs, and KB passages. She produces:

- Meeting objective.
- Relevant project context.
- What changed since the last related meeting.
- Previous decisions and commitments.
- Open actions and unresolved questions.
- Stakeholder context.
- Risks or dependencies to raise.
- Decisions required in the meeting.
- Suggested agenda and questions.
- Source citations.

### 8.4 Post-meeting run

The PM uploads or selects a transcript after the meeting.

Luci produces:

- Executive summary.
- What changed.
- Decisions made.
- Commitments, owners, and deadlines when explicitly stated.
- Risks and dependencies.
- Open questions.
- Conflicts with existing project memory.
- Implications for the initiative goal.
- Proposed actions.
- Proposed M3 updates.
- Updated visual artifact.

The PM reviews proposed memory updates and actions before approval when they change authoritative project state or create external work.

### 8.5 Weekly review

The PM manually invokes a weekly review for the MVP. Luci aggregates completed runs and current initiative state into:

- Progress toward the goal.
- Important decisions and changes.
- Completed actions.
- Outstanding and overdue actions.
- Blockers and dependencies.
- New or escalating risks.
- Decisions needed.
- Recommended priorities for the next week.
- Alignment between current work and success metrics.

Automated scheduling is post-MVP.

### 8.6 General synthesis

The PM can ask Luci an initiative-specific question or request synthesis from selected evidence. Luci uses the same evidence, citation, and memory rules.

---

## 9. Multi-agent design

Hermes runs Luci and the specialist workflows.

### 9.1 Luci / orchestrator

- Understands user intent.
- Creates the run plan.
- Selects and invokes specialists.
- Retrieves relevant KB and memory.
- Consolidates structured results.
- Resolves duplicate outputs.
- Publishes the final response.
- Proposes M3 updates.

### 9.2 Context retriever

- Searches R&R, KB, prior runs, and M3.
- Ranks evidence for the run intent.
- Returns cited passages.

### 9.3 Synthesizer

- Produces pre-meeting and post-meeting synthesis.
- Separates facts, decisions, assumptions, and questions.
- Relates new information to the initiative goal.

### 9.4 Artifact generator

- Produces an initiative mind map or workstream/dependency diagram.
- Produces structured decision records when required.
- Generates artifacts from cited project state.

### 9.5 Action and follow-up manager

- Extracts explicit commitments.
- Proposes actionable follow-ups.
- Creates Kanban cards after approval.
- Tracks owner, deadline, dependency, status, source, and verification.
- Never invents ownership or deadlines.

### 9.6 Memory curator

- Compares M2 with existing M3.
- Proposes additions, confirmations, disputes, and supersessions.
- Deduplicates semantically equivalent records.
- Preserves provenance.

### 9.7 Weekly summarizer

- Aggregates runs, memory, artifacts, and action states.
- Produces goal-oriented weekly review and next-week alignment.

### 9.8 MVP implementation note

These are logical specialist roles. They do not all need to be separate long-running processes. A small number of Hermes skills or structured agent calls may implement them to reduce latency and build complexity.

---

## 10. Artifacts

### 10.1 MVP artifacts

The MVP generates:

1. A pre-meeting brief.
2. A post-meeting synthesis.
3. A Mermaid initiative mind map or workstream/dependency diagram.
4. A Kanban action register.
5. A weekly review.

### 10.2 Optional stretch artifacts

- Architecture or C4-style diagram.
- Decision record or ADR.
- Mental-model explainer.
- Podcast or audio briefing.
- GitHub issue.

### 10.3 Artifact requirements

Every artifact stores:

- Initiative ID.
- Originating run ID.
- Type.
- Title.
- Content.
- Source references.
- Version.
- Creation timestamp.

Artifacts may be regenerated, but historical run versions remain available.

---

## 11. Kanban and follow-up management

### 11.1 Board states

```text
Proposed → Approved → In Progress → Waiting / Blocked → Done → Verified
```

### 11.2 Action fields

- Title.
- Description.
- Initiative ID.
- Originating run ID.
- Source evidence IDs.
- Owner, if explicitly known or assigned by the PM.
- Deadline, if explicitly known or assigned by the PM.
- Status.
- Priority when assigned by the PM.
- Dependencies.
- External link.
- Verification state.

### 11.3 Approval rules

- Extracted commitments can be shown immediately.
- Proposed new work begins in `Proposed`.
- Luci cannot assign an unknown owner or deadline.
- External issue creation requires explicit approval.
- All approvals and state changes are logged.

### 11.4 MVP execution

The MVP board works inside Mosaic. Creating one real approved GitHub issue is a stretch goal, not a dependency for demonstrating the core product.

---

## 12. User experience

### 12.1 Main screens

1. Demo sign-in or seeded-user entry.
2. Initiative dashboard.
3. Initiative workspace.
4. Knowledge and evidence panel.
5. Run composer.
6. Live Luci run view.
7. Run result with citations.
8. Visual artifact view.
9. Kanban board.
10. Memory timeline or project knowledge view.

### 12.2 Initiative workspace layout

The initiative workspace should make five things immediately visible:

- Goal and success metrics.
- Current project summary.
- Latest Luci output.
- Active actions and blockers.
- Recent memory changes and source evidence.

### 12.3 Live run states

```text
CREATED
→ RETRIEVING_CONTEXT
→ SYNTHESIZING
→ GENERATING_ARTIFACTS
→ CURATING_MEMORY
→ PROPOSING_ACTIONS
→ COMPLETED
```

Additional terminal states:

- `FAILED`
- `CANCELLED`

### 12.4 Observable run details

For each task, show:

- Agent or specialist name.
- User-safe task description.
- Status and duration.
- Source references.
- Structured output summary.
- Tool activity when useful.
- User-readable error.

---

## 13. Functional requirements

### 13.1 Workspace and initiative

- The user can enter the demo workspace.
- The user can view a seeded initiative.
- The user can create or edit an initiative if time permits.
- The initiative retains historical runs.

### 13.2 Evidence

- The user can view seeded sources.
- The user can paste or upload supported content.
- Evidence is scoped to an initiative.
- Generated claims link back to evidence.

### 13.3 Runs

- The user can start a supported run type.
- Only one run per initiative executes at a time in the MVP.
- Each run stores immutable input snapshots.
- The user can see progress and final outputs.

### 13.4 Memory

- Luci retrieves relevant M3 records in later runs.
- New durable facts are proposed or written according to the approval policy.
- Contradictions do not silently overwrite established memory.
- The UI can show why Luci remembers a fact.

### 13.5 Artifacts and actions

- A post-meeting run generates a visual artifact.
- Proposed actions appear on the Kanban board.
- Unknown owners and deadlines remain empty.
- Actions retain their source and run linkage.

### 13.6 Weekly review

- The user can manually generate a review across multiple runs.
- The review connects activity to the initiative goal.

---

## 14. Data model

The exact persistence technology may change during implementation. The logical model is authoritative.

```typescript
type Workspace = {
  id: string
  userId: string
  name: string
  companyName?: string
}

type PersonaProfile = {
  id: string
  workspaceId: string
  role: "PRODUCT_MANAGER"
  title?: string
  responsibilities: string[]
  scope: string[]
  goals: string[]
  decisionAuthority: string[]
  stakeholderIds: string[]
  preferredArtifactTypes: ArtifactType[]
}

type Initiative = {
  id: string
  workspaceId: string
  name: string
  objective: string
  description?: string
  successMetrics: string[]
  targetDate?: string
  stage?: string
  health?: "ON_TRACK" | "AT_RISK" | "BLOCKED" | "UNKNOWN"
  createdAt: string
  updatedAt: string
}

type EvidenceSource = {
  id: string
  initiativeId: string
  type: "ROLE_PROFILE" | "BRIEF" | "PRD" | "TRANSCRIPT" | "SLACK" | "TICKETS" | "DECISION_LOG" | "OTHER"
  title: string
  content: string
  metadata: Record<string, unknown>
  createdAt: string
}

type Run = {
  id: string
  initiativeId: string
  type: "PRE_MEETING" | "POST_MEETING" | "WEEKLY_REVIEW" | "GENERAL_SYNTHESIS"
  intent: string
  status: RunStatus
  startedAt?: string
  completedAt?: string
  createdAt: string
}

type RunEvidenceSnapshot = {
  id: string
  runId: string
  evidenceSourceId: string
  excerpt?: string
  contentHash: string
  relevanceScore?: number
}

type MemoryRecord = {
  id: string
  initiativeId: string
  sourceRunId: string
  sourceEvidenceIds: string[]
  type: "FACT" | "DECISION" | "COMMITMENT" | "STAKEHOLDER" | "RISK" | "DEPENDENCY" | "OPEN_QUESTION" | "METRIC" | "VOCABULARY"
  statement: string
  structuredValue?: Record<string, unknown>
  confidence: number
  status: "PROPOSED" | "CONFIRMED" | "DISPUTED" | "SUPERSEDED"
  supersededById?: string
  firstSeenAt: string
  lastConfirmedAt: string
}

type Artifact = {
  id: string
  initiativeId: string
  runId: string
  type: "PRE_MEETING_BRIEF" | "POST_MEETING_SYNTHESIS" | "MIND_MAP" | "WEEKLY_REVIEW" | "DECISION_RECORD" | "PODCAST"
  title: string
  content: string
  sourceEvidenceIds: string[]
  version: number
  createdAt: string
}

type Action = {
  id: string
  initiativeId: string
  sourceRunId: string
  sourceEvidenceIds: string[]
  title: string
  description?: string
  owner?: string
  deadline?: string
  status: "PROPOSED" | "APPROVED" | "IN_PROGRESS" | "WAITING" | "BLOCKED" | "DONE" | "VERIFIED"
  dependencyIds: string[]
  externalUrl?: string
  createdAt: string
  updatedAt: string
}

type AgentTask = {
  id: string
  runId: string
  agentType: string
  task: string
  status: "WAITING" | "RUNNING" | "COMPLETED" | "FAILED"
  inputSourceIds: string[]
  outputSummary?: string
  durationMs?: number
  errorMessage?: string
}
```

---

## 15. Technical architecture

### 15.1 Local development architecture

```text
Mosaic web application
↓
Application API and persistence
↓
Local Hermes gateway
↓
Luci orchestration and specialist skills
↓
OpenAI model provider
```

The application database stores canonical users, initiatives, sources, runs, artifacts, actions, and M3 memory. Hermes-native sessions and memory support Luci but are not the only project system of record.

### 15.2 Deployment architecture

```text
Cloudflare-hosted Mosaic UI
↓
Cloudflare Worker API / router
↓
Hermes container
↓
Application persistence and synthetic KB
```

### 15.3 Deployment sequence

1. Build the vertical slice locally.
2. Validate repeatable Hermes runs and memory retrieval.
3. Containerize the working Hermes configuration and Luci skills.
4. Deploy the Mosaic UI and API to Cloudflare.
5. Deploy Hermes using Cloudflare Containers if time and account capabilities permit.
6. Keep a documented fallback for running Hermes on another container host while Mosaic remains on Cloudflare.

### 15.4 Runtime constraints

- One active run per initiative in the MVP.
- One Hermes gateway/container is sufficient for the demonstration.
- Secrets must remain server-side.
- The system must tolerate a restarted Hermes process because canonical project state is persisted outside the agent session.

---

## 16. Security and privacy

- Workspace and initiative data are private.
- Sources selected for one initiative are not exposed to another.
- API keys and provider secrets are not sent to the browser.
- Secrets and raw prompts are not logged in user-visible traces.
- External actions require human approval.
- Source content and memory can be deleted with the initiative.
- Synthetic data must not contain real confidential company information.

---

## 17. MVP scope

### 17.1 Required

- Seeded PM persona and R&R.
- One seeded product initiative.
- Synthetic KB with Markdown, transcript, Slack JSON, and ticket data.
- Local Hermes integration using the configured OpenAI connector.
- Luci orchestration.
- Pre-meeting brief with citations.
- Post-meeting synthesis with citations.
- M1/M2/M3 memory flow.
- Durable memory visible across at least two runs.
- One Mermaid visual artifact.
- Kanban action board.
- Manual weekly review.
- Observable agent run timeline.
- Local end-to-end demonstration.

### 17.2 Stretch

- Email/password authentication.
- User-created initiatives.
- PDF upload and parsing.
- Real GitHub issue creation.
- Podcast/audio artifact.
- Cloudflare Container deployment for Hermes.
- Automated reminders or weekly schedules.

### 17.3 Explicitly excluded

- Live Google Drive ingestion.
- Live Slack ingestion.
- Live Confluence or Notion ingestion.
- Jira or Linear integration.
- Calendar and meeting-bot integration.
- Multiple personas.
- Shared workspaces and team permissions.
- Billing.
- Autonomous scope, ownership, deadline, or priority decisions.
- Production-scale multi-tenancy.
- Parallel runs for the same initiative.

---

## 18. Four-hour vertical slice

### Hour 1: Seed the world and connect Hermes

- Create the PM R&R.
- Create the initiative and synthetic KB.
- Define schemas for runs, evidence, memory, artifacts, and actions.
- Connect the application to the local Hermes gateway.
- Complete one structured Luci call.

**Success condition:** Luci receives the initiative intent and retrieves cited context from the seeded KB.

### Hour 2: Prove the before-and-after workflow

- Implement pre-meeting synthesis.
- Add the current meeting transcript.
- Implement post-meeting synthesis.
- Extract decisions, risks, dependencies, questions, and actions.

**Success condition:** Luci generates a useful cited brief and a structured post-meeting result.

### Hour 3: Prove memory and artifacts

- Store M2 run state.
- Promote selected durable records into M3.
- Generate a Mermaid mind map.
- Start a later run that retrieves a prior decision from M3.

**Success condition:** Luci correctly uses prior-run memory and shows its provenance.

### Hour 4: Make the proof visible

- Build the initiative view.
- Build the live run timeline.
- Render the pre/post synthesis and mind map.
- Populate the Kanban board.
- Add manual weekly review if the core loop is stable.
- Rehearse the demo and prepare deployment.

**Success condition:** A PM can complete the core flow without developer tools.

---

## 19. Evaluation

### 19.1 Fixed scenarios

#### Scenario A: Relevant recall

A decision appears only in an earlier meeting. Luci must retrieve and use it in a later pre-meeting brief with a citation.

#### Scenario B: Changed decision

A new transcript conflicts with an established decision. Luci must show both sources and propose supersession instead of silently overwriting memory.

#### Scenario C: Missing ownership

A follow-up is required but no owner is stated. Luci must create a proposed Kanban action with no owner and show **Human assignment required**.

#### Scenario D: Persona relevance

The KB contains information unrelated to the PM's scope. Luci must prioritize information relevant to the PM's R&R and meeting intent.

### 19.2 Quality thresholds

- Zero invented owners.
- Zero invented deadlines.
- Every important claim has a valid source citation.
- Prior-run memory is correctly retrieved in a later run.
- A contradiction does not silently replace confirmed memory.
- Generated actions retain their originating evidence and run.
- The Mermaid artifact reflects the synthesized initiative state.
- The complete demo can be performed reliably at least three times.

---

## 20. Demo narrative

1. Open Mosaic as a seeded Product Manager.
2. Show the PM's R&R and the initiative goal.
3. Ask Luci to prepare for an upcoming cross-functional meeting.
4. Show the cited pre-meeting brief using the synthetic KB and prior memory.
5. Add the new meeting transcript.
6. Run post-meeting synthesis.
7. Show what changed, decisions, risks, dependencies, and open questions.
8. Show the updated mind map.
9. Review proposed Kanban actions, including one missing an owner.
10. Show proposed additions or changes to initiative memory.
11. Start another run and demonstrate that Luci remembers a prior decision.
12. Generate the weekly review if included.

### Demo closing statement

> Meeting assistants remember a meeting. Luci remembers the initiative. Mosaic turns fragmented company knowledge into the context, artifacts, and follow-through a Product Manager needs to keep complex work moving.

---

## 21. Definition of done

The MVP is complete when:

1. Mosaic clearly presents Luci as the PM's project-management agent.
2. A seeded PM persona and R&R influence Luci's output.
3. A seeded initiative contains a multi-run synthetic KB.
4. Hermes executes Luci using the configured OpenAI provider.
5. Luci generates a cited pre-meeting brief.
6. Luci processes a new transcript into a cited post-meeting synthesis.
7. Luci extracts decisions, risks, dependencies, open questions, and actions.
8. Luci generates a readable Mermaid mind map.
9. Proposed actions appear on a Kanban board.
10. Unknown owners and deadlines remain unassigned.
11. Durable initiative memory persists across runs.
12. A later run retrieves and uses prior memory with provenance.
13. Conflicting information is surfaced without destructive overwrite.
14. The PM can inspect the run timeline and source evidence.
15. The full local demo runs reliably without developer intervention.
16. Cloudflare deployment is completed if it does not threaten the working local demo.
