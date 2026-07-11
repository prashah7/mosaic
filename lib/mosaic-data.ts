import type {
  AgentTask,
  Artifact,
  EvidenceSource,
  Initiative,
  KanbanAction,
  MemoryRecord,
  PmProfile,
  Run,
  RunEvent,
  Workspace,
} from "@/lib/types";

export const SEED_INITIATIVE_ID = "init_sso";

export const workspace: Workspace = {
  id: "ws_1",
  name: "Sambit's workspace",
  companyName: "Northline Software",
  ownerName: "Sambit Nayak",
  ownerEmail: "sambit@northline.dev",
  roleTitle: "Product Manager",
};

export const pmProfile: PmProfile = {
  title: "Product Manager, Platform",
  responsibilities: [
    "Own enterprise authentication outcomes",
    "Coordinate eng, legal, CS, and infra for SSO launch",
    "Drive decisions and follow-through across meetings",
  ],
  ownedAreas: ["Enterprise SSO", "Admin identity settings"],
  decisionAuthority: "Product scope and launch sequencing; not legal policy",
  stakeholders: [
    "Priya Chen (Eng)",
    "Marcus Webb (Infra)",
    "Legal",
    "Customer Success",
  ],
  preferredOutputs: [
    "Pre-meeting briefs",
    "Decision logs",
    "Action boards",
    "Mind maps",
  ],
};

export const initiatives: Initiative[] = [
  {
    id: SEED_INITIATIVE_ID,
    name: "Enterprise SSO launch",
    objective:
      "Launch SAML SSO for three enterprise design partners by September 30 without disrupting password login.",
    description:
      "Design-partner launch for SAML SSO with Test Connection, admin configuration, and audit logging readiness.",
    deadline: "2026-09-30",
    successMetrics: [
      "Three design partners activated on SAML",
      "95% authentication success rate",
      "No disruption to password login",
    ],
    stage: "Engineering readiness",
    ownerName: "Sambit Nayak",
    health: "Needs attention",
    stakeholders: [
      "Priya Chen (Eng)",
      "Marcus Webb (Infra)",
      "Legal",
      "Customer Success",
    ],
    summary:
      "SAML is confirmed for v1; SCIM deferred in the latest architecture meeting. Audit logging remains required without an owner. Test Connection was decided but is not yet in the ticket plan.",
    lastRunAt: "2026-07-11T20:32:00.000Z",
    latestRunId: "run_post_1",
  },
];

export const evidenceSources: EvidenceSource[] = [
  {
    id: "src_rr",
    initiativeId: SEED_INITIATIVE_ID,
    type: "RR_PROFILE",
    title: "PM R&R — Sambit Nayak",
    content: `Title: Product Manager, Platform
Owns: Enterprise SSO outcomes, admin identity settings
Coordinates: Eng, Infra, Legal, CS
Decision authority: Product scope and sequencing; legal policy stays with Legal.
Preferred outputs: briefs, decisions, action boards, mind maps.`,
    wordCount: 48,
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: "src_prd",
    initiativeId: SEED_INITIATIVE_ID,
    type: "PRD",
    title: "Enterprise SSO PRD v1.3",
    content: `Goal: Launch SAML SSO for three enterprise design partners by September 30.
In scope: SAML 2.0, SCIM provisioning, admin Test Connection, audit logging.
Out of scope: OIDC, custom IdP branding.
Success metrics: 3 partners activated, 95% auth success, no password-login disruption.`,
    wordCount: 62,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-08T14:20:00.000Z",
  },
  {
    id: "src_prior",
    initiativeId: SEED_INITIATIVE_ID,
    type: "MEETING_TRANSCRIPT",
    title: "Prior planning sync — July 1",
    content: `Team aligned that password login must remain available as fallback.
Priya tentatively owns configuration UI.
CS flagged Acme Design as first partner needing an activation update.`,
    wordCount: 38,
    createdAt: "2026-07-01T18:00:00.000Z",
    updatedAt: "2026-07-01T18:00:00.000Z",
  },
  {
    id: "src_transcript",
    initiativeId: SEED_INITIATIVE_ID,
    type: "MEETING_TRANSCRIPT",
    title: "Architecture planning — July 8",
    content: `Priya: For v1 we ship SAML first and revisit SCIM later. SCIM is deferred.
Marcus: Admins need a Test Connection action before they flip SSO on.
Priya: I own the configuration UI.
Legal: Audit logging is required for the design partners.
CS: We promised Acme Design an update by Friday on activation timing.
Open: No owner assigned yet for audit logging implementation.`,
    wordCount: 92,
    createdAt: "2026-07-08T18:00:00.000Z",
    updatedAt: "2026-07-08T18:00:00.000Z",
  },
  {
    id: "src_tickets",
    initiativeId: SEED_INITIATIVE_ID,
    type: "TICKET_LIST",
    title: "Current engineering tickets",
    content: `ENG-210 Enterprise authentication (SAML) — In progress — Owner: Priya
ENG-211 IdP configuration UI — Ready — Owner: Priya
ENG-214 Partner activation checklist — Backlog — Owner: CS
Missing: audit logging ticket, Test Connection ticket.`,
    wordCount: 48,
    createdAt: "2026-07-09T10:00:00.000Z",
    updatedAt: "2026-07-09T10:00:00.000Z",
  },
  {
    id: "src_slack",
    initiativeId: SEED_INITIATIVE_ID,
    type: "SLACK_DISCUSSION",
    title: "#enterprise-sso thread",
    content: `CS: Acme asked again for SSO ETA — told them Friday update.
Eng: SCIM still listed in PRD, please confirm deferral.
Security: Need audit log owner before partner go-live.`,
    wordCount: 36,
    createdAt: "2026-07-10T15:30:00.000Z",
    updatedAt: "2026-07-10T15:30:00.000Z",
  },
];

export const runs: Run[] = [
  {
    id: "run_pre_1",
    initiativeId: SEED_INITIATIVE_ID,
    type: "PRE_MEETING",
    status: "COMPLETED",
    instruction:
      "Prepare me for the July 8 architecture planning meeting with eng, infra, legal, and CS.",
    startedAt: "2026-07-08T15:00:00.000Z",
    completedAt: "2026-07-08T15:01:40.000Z",
    createdAt: "2026-07-08T14:59:00.000Z",
    durationMs: 100000,
    triggeredBy: "Sambit Nayak",
    evidenceSourceIds: ["src_rr", "src_prd", "src_prior", "src_tickets"],
    retrievedMemoryIds: ["mem_password_fallback"],
    opinion:
      "Go into the meeting ready to lock SAML-first scope, surface audit-logging ownership, and protect the Acme Friday commitment.",
    synthesis: [
      {
        id: "pre_1",
        kind: "summary",
        title: "Meeting objective",
        body: "Align eng/infra/legal/CS on v1 SSO scope, ownership of admin configuration, and partner activation risks before build accelerates.",
        citations: [
          {
            sourceId: "src_rr",
            sourceTitle: "PM R&R",
            excerpt: "Owns enterprise authentication outcomes",
          },
        ],
      },
      {
        id: "pre_2",
        kind: "changed",
        title: "What changed since last sync",
        body: "PRD still lists SCIM in v1. Tickets cover SAML and config UI, but not Test Connection or audit logging.",
        citations: [
          {
            sourceId: "src_prd",
            sourceTitle: "PRD v1.3",
            excerpt: "In scope: SAML 2.0, SCIM provisioning…",
          },
          {
            sourceId: "src_tickets",
            sourceTitle: "Ticket list",
            excerpt: "Missing: audit logging ticket, Test Connection ticket.",
          },
        ],
      },
      {
        id: "pre_3",
        kind: "decision",
        title: "Prior decision to protect",
        body: "Password login must remain available as fallback — already aligned on July 1.",
        citations: [
          {
            sourceId: "src_prior",
            sourceTitle: "Prior planning sync",
            excerpt: "password login must remain available as fallback",
          },
        ],
      },
      {
        id: "pre_4",
        kind: "agenda",
        title: "Suggested questions",
        body: "1) Is SCIM in or out of v1? 2) Who owns audit logging? 3) Do we require Test Connection before enablement? 4) What does CS tell Acme on Friday?",
        citations: [],
      },
      {
        id: "pre_5",
        kind: "risk",
        title: "Raise in-room",
        body: "Partner go-live risk if audit logging stays ownerless; scope conflict if SCIM remains in the PRD.",
        citations: [
          {
            sourceId: "src_prd",
            sourceTitle: "PRD v1.3",
            excerpt: "SCIM provisioning",
          },
        ],
      },
    ],
  },
  {
    id: "run_post_1",
    initiativeId: SEED_INITIATIVE_ID,
    type: "POST_MEETING",
    status: "COMPLETED",
    instruction:
      "Synthesize the July 8 architecture meeting and update initiative memory and follow-ups.",
    startedAt: "2026-07-11T20:30:00.000Z",
    completedAt: "2026-07-11T20:32:14.000Z",
    createdAt: "2026-07-11T20:29:40.000Z",
    durationMs: 134000,
    triggeredBy: "Sambit Nayak",
    evidenceSourceIds: [
      "src_transcript",
      "src_prd",
      "src_tickets",
      "src_slack",
    ],
    retrievedMemoryIds: ["mem_password_fallback"],
    opinion:
      "SAML-first is confirmed and SCIM is deferred, but the PRD still contradicts that. Audit logging is required with no owner — human assignment required before go-live.",
    synthesis: [
      {
        id: "post_1",
        kind: "summary",
        title: "Executive summary",
        body: "The team locked SAML for v1 and deferred SCIM. Priya owns configuration UI. Test Connection is required before enablement. Audit logging is mandatory but still has no owner. CS owes Acme an update by Friday.",
        citations: [
          {
            sourceId: "src_transcript",
            sourceTitle: "Architecture planning — July 8",
            excerpt: "SCIM is deferred",
          },
        ],
      },
      {
        id: "post_2",
        kind: "changed",
        title: "What changed",
        body: "SCIM moved from in-scope (PRD) to deferred (meeting). Test Connection became an explicit requirement. Audit logging escalated from PRD mention to legal requirement without an execution owner.",
        citations: [
          {
            sourceId: "src_prd",
            sourceTitle: "PRD v1.3",
            excerpt: "SCIM provisioning",
          },
          {
            sourceId: "src_transcript",
            sourceTitle: "Architecture planning — July 8",
            excerpt: "Audit logging is required for the design partners",
          },
        ],
      },
      {
        id: "post_3",
        kind: "decision",
        title: "Decisions made",
        body: "Ship SAML first; defer SCIM. Priya owns configuration UI. Admins need Test Connection before SSO enablement.",
        citations: [
          {
            sourceId: "src_transcript",
            sourceTitle: "Architecture planning — July 8",
            excerpt: "I own the configuration UI",
          },
        ],
      },
      {
        id: "post_4",
        kind: "commitment",
        title: "Commitments",
        body: "CS will update Acme Design on activation timing by Friday.",
        citations: [
          {
            sourceId: "src_transcript",
            sourceTitle: "Architecture planning — July 8",
            excerpt: "update by Friday on activation timing",
          },
        ],
      },
      {
        id: "post_5",
        kind: "risk",
        title: "Risks & dependencies",
        body: "Audit logging has no owner or ticket. PRD still lists deferred SCIM as in scope — memory conflict with the meeting decision.",
        citations: [
          {
            sourceId: "src_transcript",
            sourceTitle: "Architecture planning — July 8",
            excerpt: "No owner assigned yet for audit logging",
          },
        ],
      },
      {
        id: "post_6",
        kind: "question",
        title: "Open questions",
        body: "Who owns audit logging implementation? Should the PRD be corrected to move SCIM to non-goals immediately?",
        citations: [],
      },
    ],
  },
];

export const agentTasks: AgentTask[] = [
  {
    id: "task_luci_post",
    runId: "run_post_1",
    agentType: "LUCI",
    task: "Plan post-meeting synthesis",
    status: "COMPLETED",
    outputSummary: "Invoked retriever, synthesizer, artifact, memory, actions",
    durationMs: 12000,
  },
  {
    id: "task_ctx_post",
    runId: "run_post_1",
    agentType: "CONTEXT_RETRIEVER",
    task: "Retrieve KB + M3 for SSO initiative",
    status: "COMPLETED",
    outputSummary: "Pulled transcript, PRD, tickets, Slack, password-fallback memory",
    durationMs: 22000,
  },
  {
    id: "task_syn_post",
    runId: "run_post_1",
    agentType: "SYNTHESIZER",
    task: "Produce cited post-meeting synthesis",
    status: "COMPLETED",
    outputSummary: "Decisions, commitments, risks, questions linked to goal",
    durationMs: 34000,
  },
  {
    id: "task_art_post",
    runId: "run_post_1",
    agentType: "ARTIFACT_GENERATOR",
    task: "Generate initiative mind map",
    status: "COMPLETED",
    outputSummary: "Mermaid mind map of scope, owners, gaps",
    durationMs: 18000,
  },
  {
    id: "task_mem_post",
    runId: "run_post_1",
    agentType: "MEMORY_CURATOR",
    task: "Propose durable M3 updates",
    status: "COMPLETED",
    outputSummary: "3 proposed memory records; 1 PRD conflict flagged",
    durationMs: 16000,
  },
  {
    id: "task_act_post",
    runId: "run_post_1",
    agentType: "ACTION_MANAGER",
    task: "Propose Kanban follow-ups",
    status: "COMPLETED",
    outputSummary: "4 actions; audit logging owner left null",
    durationMs: 14000,
  },
];

export const runEvents: RunEvent[] = [
  {
    id: "evt_1",
    runId: "run_post_1",
    sequence: 1,
    eventType: "RUN_STARTED",
    level: "INFO",
    message: "Luci started post-meeting synthesis for Enterprise SSO.",
    createdAt: "2026-07-11T20:30:00.000Z",
  },
  {
    id: "evt_2",
    runId: "run_post_1",
    sequence: 2,
    eventType: "CONTEXT_RETRIEVED",
    level: "INFO",
    message: "Retrieved password-fallback decision from M3 with provenance.",
    createdAt: "2026-07-11T20:30:22.000Z",
  },
  {
    id: "evt_3",
    runId: "run_post_1",
    sequence: 3,
    eventType: "CONFLICT",
    level: "WARNING",
    message: "PRD lists SCIM in v1; transcript defers SCIM — awaiting confirmation.",
    createdAt: "2026-07-11T20:31:10.000Z",
  },
  {
    id: "evt_4",
    runId: "run_post_1",
    sequence: 4,
    eventType: "HUMAN_INPUT",
    level: "WARNING",
    message: "Audit logging owner not in evidence — Human assignment required.",
    createdAt: "2026-07-11T20:31:40.000Z",
  },
  {
    id: "evt_5",
    runId: "run_post_1",
    sequence: 5,
    eventType: "RUN_COMPLETED",
    level: "INFO",
    message: "Synthesis, mind map, memory proposals, and Kanban actions ready for review.",
    createdAt: "2026-07-11T20:32:14.000Z",
  },
];

export const memoryRecords: MemoryRecord[] = [
  {
    id: "mem_password_fallback",
    initiativeId: SEED_INITIATIVE_ID,
    type: "DECISION",
    statement: "Password login remains available as fallback for v1.",
    sourceEvidenceIds: ["src_prior"],
    sourceRunId: "run_pre_1",
    confidence: 0.95,
    status: "confirmed",
    firstSeenAt: "2026-07-01T18:00:00.000Z",
    lastConfirmedAt: "2026-07-08T15:01:00.000Z",
  },
  {
    id: "mem_saml_first",
    initiativeId: SEED_INITIATIVE_ID,
    type: "DECISION",
    statement: "Ship SAML in v1; SCIM is deferred.",
    sourceEvidenceIds: ["src_transcript"],
    sourceRunId: "run_post_1",
    confidence: 0.96,
    status: "proposed",
    firstSeenAt: "2026-07-11T20:31:00.000Z",
    lastConfirmedAt: "2026-07-11T20:31:00.000Z",
    proposed: true,
  },
  {
    id: "mem_scim_prd_conflict",
    initiativeId: SEED_INITIATIVE_ID,
    type: "FACT",
    statement: "PRD still lists SCIM provisioning as in scope for v1 (conflicts with meeting deferral).",
    sourceEvidenceIds: ["src_prd", "src_transcript"],
    sourceRunId: "run_post_1",
    confidence: 0.93,
    status: "disputed",
    firstSeenAt: "2026-07-11T20:31:10.000Z",
    lastConfirmedAt: "2026-07-11T20:31:10.000Z",
    proposed: true,
  },
  {
    id: "mem_priya_ui",
    initiativeId: SEED_INITIATIVE_ID,
    type: "STAKEHOLDER",
    statement: "Priya Chen owns the SSO configuration UI.",
    sourceEvidenceIds: ["src_transcript"],
    sourceRunId: "run_post_1",
    confidence: 0.97,
    status: "proposed",
    firstSeenAt: "2026-07-11T20:31:20.000Z",
    lastConfirmedAt: "2026-07-11T20:31:20.000Z",
    proposed: true,
  },
  {
    id: "mem_audit_gap",
    initiativeId: SEED_INITIATIVE_ID,
    type: "RISK",
    statement: "Audit logging is required for design partners but has no execution owner.",
    sourceEvidenceIds: ["src_transcript"],
    sourceRunId: "run_post_1",
    confidence: 0.98,
    status: "proposed",
    firstSeenAt: "2026-07-11T20:31:40.000Z",
    lastConfirmedAt: "2026-07-11T20:31:40.000Z",
    requiresHumanInput: true,
    proposed: true,
  },
];

export const kanbanActions: KanbanAction[] = [
  {
    id: "kan_1",
    initiativeId: SEED_INITIATIVE_ID,
    runId: "run_post_1",
    title: "Create Test Connection ticket",
    description:
      "Add an eng ticket for admin Test Connection required before SSO enablement.",
    column: "TODO",
    ownerName: "Priya Chen",
    approvalStatus: "PROPOSED",
    citations: [
      {
        sourceId: "src_transcript",
        sourceTitle: "Architecture planning — July 8",
        excerpt: "Admins need a Test Connection action",
      },
    ],
  },
  {
    id: "kan_2",
    initiativeId: SEED_INITIATIVE_ID,
    runId: "run_post_1",
    title: "Assign audit logging owner",
    description:
      "Legal requires audit logging for design partners. No owner in evidence.",
    column: "TODO",
    ownerName: null,
    approvalStatus: "PROPOSED",
    citations: [
      {
        sourceId: "src_transcript",
        sourceTitle: "Architecture planning — July 8",
        excerpt: "No owner assigned yet for audit logging",
      },
    ],
  },
  {
    id: "kan_3",
    initiativeId: SEED_INITIATIVE_ID,
    runId: "run_post_1",
    title: "Correct PRD: move SCIM to non-goals",
    description:
      "Meeting deferred SCIM; PRD still lists it in scope. Record the supersession.",
    column: "TODO",
    ownerName: "Sambit Nayak",
    approvalStatus: "PROPOSED",
    citations: [
      {
        sourceId: "src_prd",
        sourceTitle: "PRD v1.3",
        excerpt: "SCIM provisioning",
      },
    ],
  },
  {
    id: "kan_4",
    initiativeId: SEED_INITIATIVE_ID,
    runId: "run_post_1",
    title: "CS update to Acme by Friday",
    description: "Share activation timing update promised in the meeting.",
    column: "DOING",
    ownerName: "Customer Success",
    deadline: "2026-07-11",
    approvalStatus: "APPROVED",
    citations: [
      {
        sourceId: "src_transcript",
        sourceTitle: "Architecture planning — July 8",
        excerpt: "update by Friday on activation timing",
      },
    ],
  },
];

export const artifacts: Artifact[] = [
  {
    id: "art_mind_1",
    initiativeId: SEED_INITIATIVE_ID,
    runId: "run_post_1",
    type: "MIND_MAP",
    title: "SSO initiative mind map",
    content: `mindmap
  root((Enterprise SSO))
    Goal
      3 partners by Sep 30
      95% auth success
      Password fallback
    Scope_v1
      SAML
      Test Connection
      Audit logging
      SCIM deferred
    Owners
      Priya: config UI
      CS: Acme Friday update
      Audit logging: Human assignment required
    Risks
      PRD SCIM conflict
      Missing audit owner
      Missing Test Connection ticket`,
    createdAt: "2026-07-11T20:31:50.000Z",
  },
];

export const getInitiative = (id: string): Initiative | undefined =>
  initiatives.find((i) => i.id === id);

export const getRun = (id: string): Run | undefined =>
  runs.find((r) => r.id === id);

export const getEvidenceForInitiative = (initiativeId: string): EvidenceSource[] =>
  evidenceSources.filter((e) => e.initiativeId === initiativeId);

export const getRunsForInitiative = (initiativeId: string): Run[] =>
  runs.filter((r) => r.initiativeId === initiativeId);

export const getTasksForRun = (runId: string): AgentTask[] =>
  agentTasks.filter((t) => t.runId === runId);

export const getEventsForRun = (runId: string): RunEvent[] =>
  runEvents
    .filter((e) => e.runId === runId)
    .sort((a, b) => a.sequence - b.sequence);

export const getMemoryForInitiative = (initiativeId: string): MemoryRecord[] =>
  memoryRecords.filter((m) => m.initiativeId === initiativeId);

export const getActionsForInitiative = (initiativeId: string): KanbanAction[] =>
  kanbanActions.filter((a) => a.initiativeId === initiativeId);

export const getArtifactsForRun = (runId: string): Artifact[] =>
  artifacts.filter((a) => a.runId === runId);

export const getEvidenceById = (id: string): EvidenceSource | undefined =>
  evidenceSources.find((e) => e.id === id);
