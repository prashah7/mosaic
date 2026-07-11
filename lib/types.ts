export type InitiativeStage =
  | "Discovery"
  | "Definition"
  | "Specification"
  | "Engineering readiness"
  | "Development"
  | "Launch readiness"
  | "Post launch";

export type InitiativeHealth =
  | "On track"
  | "At risk"
  | "Blocked"
  | "Needs attention";

export type EvidenceType =
  | "PRD"
  | "MEETING_TRANSCRIPT"
  | "TICKET_LIST"
  | "SLACK_DISCUSSION"
  | "DECISION_LOG"
  | "RR_PROFILE"
  | "OTHER";

export type RunType =
  | "PRE_MEETING"
  | "POST_MEETING"
  | "WEEKLY_REVIEW"
  | "GENERAL_SYNTHESIS";

export type RunStatus =
  | "CREATED"
  | "RETRIEVING_CONTEXT"
  | "SYNTHESIZING"
  | "GENERATING_ARTIFACTS"
  | "CURATING_MEMORY"
  | "PROPOSING_ACTIONS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type AgentType =
  | "LUCI"
  | "CONTEXT_RETRIEVER"
  | "SYNTHESIZER"
  | "ARTIFACT_GENERATOR"
  | "ACTION_MANAGER"
  | "MEMORY_CURATOR";

export type TaskStatus =
  | "WAITING"
  | "READY"
  | "RUNNING"
  | "BLOCKED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type MemoryType =
  | "DECISION"
  | "COMMITMENT"
  | "FACT"
  | "RISK"
  | "DEPENDENCY"
  | "OPEN_QUESTION"
  | "STAKEHOLDER"
  | "GOAL";

export type MemoryStatus =
  | "proposed"
  | "confirmed"
  | "disputed"
  | "superseded";

export type KanbanColumn = "TODO" | "DOING" | "DONE";

export type ArtifactType =
  | "PRE_MEETING_BRIEF"
  | "POST_MEETING_SYNTHESIS"
  | "MIND_MAP"
  | "WEEKLY_REVIEW";

export type Workspace = {
  id: string;
  name: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  roleTitle: string;
};

export type PmProfile = {
  title: string;
  responsibilities: string[];
  ownedAreas: string[];
  decisionAuthority: string;
  stakeholders: string[];
  preferredOutputs: string[];
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
  health: InitiativeHealth;
  stakeholders: string[];
  summary: string;
  lastRunAt?: string;
  latestRunId?: string;
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

export type Citation = {
  sourceId: string;
  sourceTitle: string;
  excerpt: string;
};

export type SynthesisBlock = {
  id: string;
  kind:
    | "summary"
    | "changed"
    | "decision"
    | "commitment"
    | "risk"
    | "dependency"
    | "question"
    | "agenda";
  title: string;
  body: string;
  citations: Citation[];
};

export type Run = {
  id: string;
  initiativeId: string;
  type: RunType;
  status: RunStatus;
  instruction: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  durationMs?: number;
  triggeredBy: string;
  evidenceSourceIds: string[];
  synthesis: SynthesisBlock[];
  opinion?: string;
  retrievedMemoryIds: string[];
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

export type MemoryRecord = {
  id: string;
  initiativeId: string;
  type: MemoryType;
  statement: string;
  sourceEvidenceIds: string[];
  sourceRunId: string;
  confidence: number;
  status: MemoryStatus;
  firstSeenAt: string;
  lastConfirmedAt: string;
  supersededBy?: string;
  requiresHumanInput?: boolean;
  proposed?: boolean;
};

export type KanbanAction = {
  id: string;
  initiativeId: string;
  runId: string;
  title: string;
  description: string;
  column: KanbanColumn;
  ownerName?: string | null;
  deadline?: string | null;
  approvalStatus: "PROPOSED" | "APPROVED" | "REJECTED";
  citations: Citation[];
};

export type Artifact = {
  id: string;
  initiativeId: string;
  runId: string;
  type: ArtifactType;
  title: string;
  content: string;
  createdAt: string;
};
