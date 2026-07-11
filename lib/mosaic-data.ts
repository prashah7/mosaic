import type {
  ActivityItem,
  AgentTask,
  Decision,
  Dependency,
  EvidenceSource,
  Finding,
  Initiative,
  RemediationAction,
  Risk,
  Run,
  RunEvent,
  VerificationResult,
  Workspace,
  Workstream,
} from "@/lib/types";

export const workspace: Workspace = {
  id: "ws_1",
  name: "Sambit's workspace",
  companyName: "Northline Software",
  ownerName: "Sambit Nayak",
  ownerEmail: "sambit@northline.dev",
};

export const initiatives: Initiative[] = [
  {
    id: "init_sso",
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
    status: "AT_RISK",
    currentScore: 62,
    stakeholders: [
      "Priya Chen (Eng)",
      "Marcus Webb (Infra)",
      "Legal",
      "Customer Success",
    ],
    lastRunAt: "2026-07-11T20:32:00.000Z",
    openFindings: 5,
    activeRunId: "run_sso_1",
  },
  {
    id: "init_billing",
    name: "Usage-based billing v2",
    objective:
      "Ship metered billing for Pro workspaces with transparent invoice previews and dispute tooling.",
    deadline: "2026-10-15",
    successMetrics: [
      "Invoice preview accuracy ≥ 99%",
      "Dispute cycle time under 2 business days",
    ],
    stage: "Definition",
    ownerName: "Aisha Rahman",
    status: "CONDITIONALLY_READY",
    currentScore: 78,
    stakeholders: ["Finance", "Platform Eng", "Support"],
    lastRunAt: "2026-07-10T16:10:00.000Z",
    openFindings: 2,
  },
  {
    id: "init_onboarding",
    name: "Self-serve onboarding rewrite",
    objective:
      "Reduce time-to-first-value for new B2B admins by replacing the 7-step checklist with guided activation.",
    successMetrics: [
      "Activation rate +12%",
      "Support tickets for setup −20%",
    ],
    stage: "Discovery",
    status: "DRAFT",
    stakeholders: ["Growth", "Design", "CS"],
    openFindings: 0,
  },
  {
    id: "init_audit",
    name: "SOC2 evidence automation",
    objective:
      "Automate quarterly control evidence collection across eng, security, and people systems.",
    deadline: "2026-08-31",
    successMetrics: ["Manual evidence hours −60%", "Zero late control packs"],
    stage: "Development",
    ownerName: "Jordan Lee",
    status: "READY",
    currentScore: 91,
    stakeholders: ["Security", "People Ops", "Eng"],
    lastRunAt: "2026-07-09T11:00:00.000Z",
    openFindings: 0,
  },
];

export const evidenceSources: EvidenceSource[] = [
  {
    id: "src_prd",
    initiativeId: "init_sso",
    type: "PRD",
    title: "Enterprise SSO PRD v1.3",
    content: `Goal: Launch SAML SSO for three enterprise design partners by September 30.

In scope: SAML 2.0, SCIM provisioning, admin Test Connection, audit logging for auth events, partner activation playbooks.
Out of scope: OIDC, custom IdP branding.

Success metrics: 3 partners activated, 95% auth success, no password-login disruption.

Requirements:
- Admins can configure IdP metadata and certificates.
- Test Connection validates configuration before enablement.
- Audit logging captures authentication attempts and admin changes.
- SCIM user lifecycle sync is required for v1.
- Password login remains available as fallback.`,
    wordCount: 118,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-08T14:20:00.000Z",
  },
  {
    id: "src_transcript",
    initiativeId: "init_sso",
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
    initiativeId: "init_sso",
    type: "TICKET_LIST",
    title: "Current engineering tickets",
    content: `ENG-210 Enterprise authentication (SAML) — In progress — Owner: Priya — AC: vague "works with Okta"
ENG-211 IdP configuration UI — Ready — Owner: Priya
ENG-214 Partner activation checklist — Backlog — Owner: CS
Missing: audit logging ticket, Test Connection ticket, auth success instrumentation.`,
    wordCount: 64,
    createdAt: "2026-07-09T10:00:00.000Z",
    updatedAt: "2026-07-09T10:00:00.000Z",
  },
  {
    id: "src_slack",
    initiativeId: "init_sso",
    type: "SLACK_DISCUSSION",
    title: "#enterprise-sso thread (synthetic)",
    content: `CS: Acme asked again for SSO ETA — told them Friday update.
Eng: SCIM still listed in PRD, please confirm deferral.
Security: Need audit log owner before partner go-live.`,
    wordCount: 36,
    createdAt: "2026-07-10T15:30:00.000Z",
    updatedAt: "2026-07-10T15:30:00.000Z",
  },
];

export const workstreams: Workstream[] = [
  {
    id: "ws_auth",
    name: "SAML authentication",
    owner: "Priya Chen",
    status: "On track",
    summary: "Core SAML flow in progress; acceptance criteria still weak.",
  },
  {
    id: "ws_admin",
    name: "Admin configuration",
    owner: "Priya Chen",
    status: "At risk",
    summary: "Test Connection required by meeting but absent from ticket plan.",
  },
  {
    id: "ws_audit",
    name: "Audit logging",
    status: "Needs owner",
    summary: "Required by legal; no owner or execution ticket.",
  },
  {
    id: "ws_cs",
    name: "Partner activation",
    owner: "Customer Success",
    status: "At risk",
    summary: "Friday commitment exists; measurement plan incomplete.",
  },
];

export const decisions: Decision[] = [
  {
    id: "dec_1",
    statement: "SAML ships in v1; SCIM is deferred.",
    source: "Architecture planning — July 8",
    status: "Confirmed",
  },
  {
    id: "dec_2",
    statement: "Admins need a Test Connection action before enablement.",
    source: "Architecture planning — July 8",
    status: "Confirmed",
  },
  {
    id: "dec_3",
    statement: "Priya owns the configuration UI.",
    source: "Architecture planning — July 8",
    status: "Confirmed",
  },
  {
    id: "dec_4",
    statement: "Whether SCIM remains in PRD scope for v1.",
    source: "PRD vs transcript conflict",
    status: "Open question",
  },
];

export const risks: Risk[] = [
  {
    id: "risk_1",
    title: "Audit logging has no execution owner",
    severity: "CRITICAL",
    mitigation: "Request human owner before partner go-live",
  },
  {
    id: "risk_2",
    title: "PRD still lists deferred SCIM as in-scope",
    severity: "HIGH",
    owner: "Sambit Nayak",
    mitigation: "Approve PRD correction",
  },
  {
    id: "risk_3",
    title: "Auth success metric lacks instrumentation",
    severity: "MEDIUM",
    mitigation: "Create measurement follow-up",
  },
];

export const dependencies: Dependency[] = [
  {
    id: "dep_1",
    title: "Legal sign-off on audit logging fields",
    team: "Legal",
    status: "Needs owner",
  },
  {
    id: "dep_2",
    title: "Infra support for auth event pipeline",
    team: "Infrastructure",
    owner: "Marcus Webb",
    status: "Owned",
  },
  {
    id: "dep_3",
    title: "CS partner update by Friday",
    team: "Customer Success",
    owner: "Customer Success",
    status: "Identified",
  },
];

export const runs: Run[] = [
  {
    id: "run_sso_1",
    initiativeId: "init_sso",
    type: "READINESS_AUDIT",
    status: "COMPLETED",
    instruction:
      "Prepare us for engineering review using the PRD, planning transcript, and current tickets.",
    score: 62,
    opinion:
      "Not ready for engineering review. Five evidence-backed gaps block a clean handoff—most critically audit logging ownership and a PRD/transcript contradiction on SCIM.",
    startedAt: "2026-07-11T20:30:00.000Z",
    completedAt: "2026-07-11T20:32:14.000Z",
    createdAt: "2026-07-11T20:29:40.000Z",
    durationMs: 134000,
    triggeredBy: "Sambit Nayak",
  },
  {
    id: "run_billing_1",
    initiativeId: "init_billing",
    type: "COORDINATION",
    status: "COMPLETED",
    instruction: "Process finance sync notes and update initiative health.",
    score: 78,
    opinion: "Conditionally ready; two ownership gaps remain on dispute SLAs.",
    startedAt: "2026-07-10T16:00:00.000Z",
    completedAt: "2026-07-10T16:08:00.000Z",
    createdAt: "2026-07-10T15:58:00.000Z",
    durationMs: 480000,
    triggeredBy: "Aisha Rahman",
  },
];

export const agentTasks: AgentTask[] = [
  {
    id: "task_luci",
    runId: "run_sso_1",
    agentType: "LUCI",
    task: "Validate inputs and publish coordination plan",
    status: "COMPLETED",
    inputSummary: "PRD, transcript, ticket list, instruction",
    outputSummary: "Planned 5 specialist tasks; sequential readiness audit",
    startedAt: "2026-07-11T20:30:00.000Z",
    completedAt: "2026-07-11T20:30:18.000Z",
    durationMs: 18000,
  },
  {
    id: "task_evidence",
    runId: "run_sso_1",
    agentType: "EVIDENCE",
    task: "Extract structured evidence without inventing owners",
    status: "COMPLETED",
    inputSummary: "3 evidence snapshots",
    outputSummary: "14 evidence items; 1 open ownership gap preserved as null",
    startedAt: "2026-07-11T20:30:18.000Z",
    completedAt: "2026-07-11T20:30:52.000Z",
    durationMs: 34000,
  },
  {
    id: "task_trace",
    runId: "run_sso_1",
    agentType: "TRACEABILITY",
    task: "Map decisions → requirements → tickets → owners",
    status: "COMPLETED",
    inputSummary: "Evidence items + ticket list",
    outputSummary: "8 links; 4 relationship gaps identified",
    startedAt: "2026-07-11T20:30:52.000Z",
    completedAt: "2026-07-11T20:31:20.000Z",
    durationMs: 28000,
  },
  {
    id: "task_standards",
    runId: "run_sso_1",
    agentType: "STANDARDS",
    task: "Apply selected readiness standards",
    status: "COMPLETED",
    inputSummary: "10 enabled standards",
    outputSummary: "5 findings drafted with severity and standard citations",
    startedAt: "2026-07-11T20:31:20.000Z",
    completedAt: "2026-07-11T20:31:48.000Z",
    durationMs: 28000,
  },
  {
    id: "task_coord",
    runId: "run_sso_1",
    agentType: "COORDINATION",
    task: "Map workstreams, risks, and proposed follow-ups",
    status: "COMPLETED",
    inputSummary: "Findings + stakeholder map",
    outputSummary: "4 workstreams, 3 risks, readiness opinion drafted",
    startedAt: "2026-07-11T20:31:48.000Z",
    completedAt: "2026-07-11T20:32:08.000Z",
    durationMs: 20000,
  },
  {
    id: "task_summary",
    runId: "run_sso_1",
    agentType: "LUCI",
    task: "Publish run health and next steps",
    status: "COMPLETED",
    inputSummary: "Deduplicated findings + score",
    outputSummary: "Score 62 AT_RISK; 5 findings awaiting PM review",
    startedAt: "2026-07-11T20:32:08.000Z",
    completedAt: "2026-07-11T20:32:14.000Z",
    durationMs: 6000,
  },
];

export const runEvents: RunEvent[] = [
  {
    id: "evt_1",
    runId: "run_sso_1",
    agentTaskId: "task_luci",
    sequence: 1,
    eventType: "RUN_STARTED",
    level: "INFO",
    message: "Luci started readiness audit for Enterprise SSO launch.",
    createdAt: "2026-07-11T20:30:00.000Z",
  },
  {
    id: "evt_2",
    runId: "run_sso_1",
    agentTaskId: "task_evidence",
    sequence: 2,
    eventType: "EVIDENCE_EXTRACTED",
    level: "INFO",
    message: "Evidence Agent extracted SCIM deferral decision from transcript ¶2.",
    createdAt: "2026-07-11T20:30:40.000Z",
  },
  {
    id: "evt_3",
    runId: "run_sso_1",
    agentTaskId: "task_evidence",
    sequence: 3,
    eventType: "HUMAN_INPUT_REQUIRED",
    level: "WARNING",
    message: "Audit logging owner not found in evidence — left as Human assignment required.",
    createdAt: "2026-07-11T20:30:48.000Z",
  },
  {
    id: "evt_4",
    runId: "run_sso_1",
    agentTaskId: "task_trace",
    sequence: 4,
    eventType: "GAP_DETECTED",
    level: "WARNING",
    message: "Test Connection decision has no matching ticket or PRD requirement.",
    createdAt: "2026-07-11T20:31:10.000Z",
  },
  {
    id: "evt_5",
    runId: "run_sso_1",
    agentTaskId: "task_standards",
    sequence: 5,
    eventType: "FINDING_CREATED",
    level: "ERROR",
    message: "Critical finding: audit logging lacks ticket and owner.",
    createdAt: "2026-07-11T20:31:36.000Z",
  },
  {
    id: "evt_6",
    runId: "run_sso_1",
    agentTaskId: "task_summary",
    sequence: 6,
    eventType: "RUN_COMPLETED",
    level: "INFO",
    message: "Run completed. Score 62 · AT_RISK. Awaiting PM finding review.",
    createdAt: "2026-07-11T20:32:14.000Z",
  },
];

export const findings: Finding[] = [
  {
    id: "find_1",
    runId: "run_sso_1",
    title: "Audit logging has no execution ticket or owner",
    category: "MISSING",
    severity: "CRITICAL",
    standardId: "std_critical_owner",
    standardLabel: "Every critical execution item has an owner",
    description:
      "Legal requires audit logging for design partners, but no ticket or owner appears in the evidence set.",
    businessImpact:
      "Partner go-live can stall or proceed without required compliance controls.",
    evidenceRefs: [
      "Transcript: “Audit logging is required…”",
      "Tickets: no audit logging item",
    ],
    confidence: 0.97,
    recommendedAction:
      "Create a GitHub issue and request a human owner before remediating further.",
    requiresHumanInput: true,
    humanInputNote: "Human assignment required",
    status: "OPEN",
  },
  {
    id: "find_2",
    runId: "run_sso_1",
    title: "SCIM deferred in meeting but included in PRD",
    category: "CONTRADICTORY",
    severity: "HIGH",
    standardId: "std_scope",
    standardLabel: "Scope and non-goals are explicit",
    description:
      "Transcript defers SCIM from v1 while the PRD still lists SCIM provisioning as in scope.",
    businessImpact:
      "Engineering may build deferred work or partners may expect unavailable capability.",
    evidenceRefs: [
      "Transcript: “SCIM is deferred”",
      "PRD: “SCIM provisioning… required for v1”",
    ],
    confidence: 0.94,
    recommendedAction: "Approve a PRD correction that moves SCIM to non-goals.",
    requiresHumanInput: true,
    humanInputNote: "Human decision required on scope",
    status: "OPEN",
  },
  {
    id: "find_3",
    runId: "run_sso_1",
    title: "Test Connection absent from PRD and ticket plan",
    category: "MISSING",
    severity: "HIGH",
    standardId: "std_launch_req",
    standardLabel: "Every launch requirement maps to an execution item",
    description:
      "Meeting decided admins need Test Connection before enablement, but neither PRD nor tickets capture it.",
    businessImpact:
      "Misconfigured SSO may be enabled in production without a validation step.",
    evidenceRefs: [
      "Transcript: “Admins need a Test Connection action”",
      "Tickets: no matching item",
    ],
    confidence: 0.93,
    recommendedAction: "Create a GitHub issue for Test Connection with clear AC.",
    requiresHumanInput: false,
    status: "OPEN",
  },
  {
    id: "find_4",
    runId: "run_sso_1",
    title: "Authentication success has no instrumentation plan",
    category: "MISSING",
    severity: "MEDIUM",
    standardId: "std_metric",
    standardLabel: "Every success metric has a measurement plan",
    description:
      "95% authentication success is a stated success metric without an instrumentation or dashboard plan.",
    businessImpact:
      "Launch readiness cannot be objectively measured after partner activation.",
    evidenceRefs: ["PRD success metrics", "Tickets: no instrumentation item"],
    confidence: 0.88,
    recommendedAction: "Create a follow-up for auth success measurement.",
    requiresHumanInput: false,
    status: "OPEN",
  },
  {
    id: "find_5",
    runId: "run_sso_1",
    title: "Enterprise authentication ticket lacks testable acceptance criteria",
    category: "MISSING",
    severity: "MEDIUM",
    standardId: "std_acceptance",
    standardLabel: "Every ticket has testable acceptance criteria",
    description:
      "ENG-210 acceptance criteria is vague (“works with Okta”) and is not testable across IdPs.",
    businessImpact:
      "QA and partner validation will disagree on done, delaying the design-partner launch.",
    evidenceRefs: ["Tickets: ENG-210 AC note"],
    confidence: 0.9,
    recommendedAction: "Update ENG-210 with testable SAML acceptance criteria.",
    requiresHumanInput: false,
    status: "OPEN",
  },
];

export const remediations: RemediationAction[] = [
  {
    id: "rem_1",
    findingId: "find_1",
    type: "CREATE_GITHUB_ISSUE",
    title: "Create audit logging execution issue",
    content:
      "## Audit logging for Enterprise SSO\n\n### Need\nCapture authentication attempts and admin SSO configuration changes for design-partner compliance.\n\n### Acceptance criteria\n- [ ] Auth success/failure events are persisted\n- [ ] Admin config changes are attributable\n- [ ] Events exportable for partner review\n\n### Owner\nHuman assignment required",
    targetSystem: "GitHub",
    requiresHumanInput: true,
    humanInputLabel: "Assign owner",
    approvalStatus: "PROPOSED",
    executionStatus: "NOT_STARTED",
    simulatedNote: "Will simulate GitHub issue creation after approval.",
  },
  {
    id: "rem_1b",
    findingId: "find_1",
    type: "REQUEST_HUMAN_OWNER",
    title: "Request audit logging owner",
    content:
      "Please assign an engineering owner for audit logging before partner go-live.",
    targetSystem: "Human",
    requiresHumanInput: true,
    humanInputLabel: "Owner name",
    approvalStatus: "PROPOSED",
    executionStatus: "BLOCKED",
  },
  {
    id: "rem_2",
    findingId: "find_2",
    type: "PRD_EDIT",
    title: "Move SCIM to non-goals for v1",
    content:
      "Update PRD scope: keep SAML in v1; move SCIM provisioning to non-goals / later release. Preserve SAML-first decision from July 8 architecture meeting.",
    targetSystem: "Mosaic",
    requiresHumanInput: false,
    approvalStatus: "PROPOSED",
    executionStatus: "NOT_STARTED",
  },
  {
    id: "rem_3",
    findingId: "find_3",
    type: "CREATE_GITHUB_ISSUE",
    title: "Create Test Connection issue",
    content:
      "## Admin Test Connection\n\n### Need\nAllow admins to validate IdP configuration before enabling SSO.\n\n### Acceptance criteria\n- [ ] Test Connection validates metadata and certificate\n- [ ] Failure states explain remediation steps\n- [ ] Successful test is required before enablement",
    targetSystem: "GitHub",
    requiresHumanInput: false,
    approvalStatus: "PROPOSED",
    executionStatus: "NOT_STARTED",
    simulatedNote: "Will simulate GitHub issue creation after approval.",
  },
];

export const verificationResults: VerificationResult[] = [];

export const activityFeed: ActivityItem[] = [
  {
    id: "act_1",
    kind: "run",
    title: "Readiness audit completed",
    detail: "Enterprise SSO · score 62 · AT_RISK",
    timestamp: "2026-07-11T20:32:14.000Z",
    href: "/initiatives/init_sso/runs/run_sso_1",
  },
  {
    id: "act_2",
    kind: "finding",
    title: "5 findings need PM attention",
    detail: "1 critical · 2 high · 2 medium",
    timestamp: "2026-07-11T20:32:14.000Z",
    href: "/initiatives/init_sso/runs/run_sso_1",
  },
  {
    id: "act_3",
    kind: "run",
    title: "Coordination run finished",
    detail: "Usage-based billing v2 · score 78",
    timestamp: "2026-07-10T16:08:00.000Z",
    href: "/initiatives/init_billing",
  },
  {
    id: "act_4",
    kind: "action",
    title: "GitHub connection ready",
    detail: "northline/platform selected as default repo (simulated)",
    timestamp: "2026-07-09T12:00:00.000Z",
    href: "/initiatives/init_sso",
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

export const getFindingsForRun = (runId: string): Finding[] =>
  findings.filter((f) => f.runId === runId);

export const getRemediationsForFindings = (
  findingIds: string[],
): RemediationAction[] =>
  remediations.filter((r) => findingIds.includes(r.findingId));
