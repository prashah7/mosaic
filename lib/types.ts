export type InitiativeStage =
  | "Discovery"
  | "Definition"
  | "Specification"
  | "Engineering readiness"
  | "Development"
  | "Launch readiness"
  | "Post launch";

export type ReadinessLabel =
  | "READY"
  | "CONDITIONALLY_READY"
  | "AT_RISK"
  | "NOT_READY"
  | "DRAFT";

export type EvidenceType =
  | "PRD"
  | "MEETING_TRANSCRIPT"
  | "TICKET_LIST"
  | "SLACK_DISCUSSION"
  | "DECISION_LOG"
  | "CUSTOMER_EVIDENCE"
  | "OTHER";

export type RunType =
  | "COORDINATION"
  | "READINESS_AUDIT"
  | "REMEDIATION"
  | "VERIFICATION";

export type RunStatus =
  | "CREATED"
  | "PLANNING"
  | "EXTRACTING_EVIDENCE"
  | "BUILDING_TRACEABILITY"
  | "APPLYING_STANDARDS"
  | "REVIEWING_FINDINGS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type AgentType =
  | "LUCI"
  | "EVIDENCE"
  | "TRACEABILITY"
  | "STANDARDS"
  | "COORDINATION"
  | "REMEDIATION"
  | "VERIFICATION";

export type TaskStatus =
  | "WAITING"
  | "READY"
  | "RUNNING"
  | "BLOCKED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type FindingCategory = "MISSING" | "CONTRADICTORY" | "UNSUPPORTED";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type FindingStatus =
  | "OPEN"
  | "ACCEPTED"
  | "REJECTED"
  | "ACCEPTED_RISK"
  | "PARTIALLY_RESOLVED"
  | "RESOLVED";

export type ActionType =
  | "PRD_EDIT"
  | "CREATE_GITHUB_ISSUE"
  | "UPDATE_GITHUB_ISSUE"
  | "CREATE_DECISION_RECORD"
  | "REQUEST_HUMAN_OWNER"
  | "REQUEST_HUMAN_DEADLINE"
  | "CREATE_FOLLOW_UP"
  | "UPDATE_INITIATIVE_STATUS";

export type ApprovalStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "EDITED";
export type ExecutionStatus =
  | "NOT_STARTED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED";

export type VerificationOutcome =
  | "OPEN"
  | "PARTIALLY_RESOLVED"
  | "RESOLVED"
  | "REJECTED"
  | "ACCEPTED_RISK";

export type Workspace = {
  id: string;
  name: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
};

export type Initiative = {
  id: string;
  name: string;
  objective: string;
  description?: string;
  deadline?: string;
  successMetrics: string[];
  stage: InitiativeStage;
  ownerName?: string;
  status: ReadinessLabel;
  currentScore?: number;
  stakeholders: string[];
  lastRunAt?: string;
  openFindings: number;
  activeRunId?: string;
};

export type EvidenceSource = {
  id: string;
  initiativeId: string;
  type: EvidenceType;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Workstream = {
  id: string;
  name: string;
  owner?: string;
  status: "On track" | "At risk" | "Blocked" | "Needs owner";
  summary: string;
};

export type Decision = {
  id: string;
  statement: string;
  source: string;
  status: "Confirmed" | "Assumed" | "Open question";
};

export type Risk = {
  id: string;
  title: string;
  severity: Severity;
  owner?: string;
  mitigation?: string;
};

export type Dependency = {
  id: string;
  title: string;
  team: string;
  owner?: string;
  status: "Identified" | "Owned" | "Mitigated" | "Needs owner";
};

export type Run = {
  id: string;
  initiativeId: string;
  parentRunId?: string;
  type: RunType;
  status: RunStatus;
  instruction: string;
  score?: number;
  opinion?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  durationMs?: number;
  triggeredBy: string;
};

export type AgentTask = {
  id: string;
  runId: string;
  agentType: AgentType;
  task: string;
  status: TaskStatus;
  inputSummary?: string;
  outputSummary?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
};

export type RunEvent = {
  id: string;
  runId: string;
  agentTaskId?: string;
  sequence: number;
  eventType: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  createdAt: string;
};

export type Finding = {
  id: string;
  runId: string;
  title: string;
  category: FindingCategory;
  severity: Severity;
  standardId: string;
  standardLabel: string;
  description: string;
  businessImpact: string;
  evidenceRefs: string[];
  confidence: number;
  recommendedAction: string;
  requiresHumanInput: boolean;
  status: FindingStatus;
  humanInputNote?: string;
};

export type RemediationAction = {
  id: string;
  findingId: string;
  type: ActionType;
  title: string;
  content: string;
  targetSystem: "Mosaic" | "GitHub" | "Human";
  requiresHumanInput: boolean;
  humanInputLabel?: string;
  humanInputValue?: string;
  approvalStatus: ApprovalStatus;
  executionStatus: ExecutionStatus;
  approvedBy?: string;
  approvedAt?: string;
  externalUrl?: string;
  externalId?: string;
  simulatedNote?: string;
};

export type VerificationResult = {
  id: string;
  findingId: string;
  actionId: string;
  outcome: VerificationOutcome;
  summary: string;
  remainingRisk?: string;
};

export type ReadinessCategory = {
  id: string;
  label: string;
  weight: number;
  impact: number;
};

export type ActivityItem = {
  id: string;
  kind: "run" | "finding" | "action" | "verification";
  title: string;
  detail: string;
  timestamp: string;
  href: string;
};
