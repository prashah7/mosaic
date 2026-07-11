import type {
  MosaicRunOutput,
  RunEvent,
  RunStatus,
  RunType,
} from "@/contracts/runs";

export type { MosaicRunOutput, RunEvent, RunStatus, RunType };

export type ActionStatus =
  | "PROPOSED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "WAITING"
  | "BLOCKED"
  | "DONE"
  | "VERIFIED";
export type SourceType =
  | "MARKDOWN"
  | "PDF"
  | "TRANSCRIPT"
  | "SLACK"
  | "TICKET"
  | "DECISION_LOG";

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  content: string;
  excerpt: string;
  initiativeId: string;
  createdAt: string;
}

export interface Action {
  id: string;
  initiativeId: string;
  runId: string;
  title: string;
  description: string;
  owner?: string;
  deadline?: string;
  status: ActionStatus;
  priority: "HIGH" | "MEDIUM" | "LOW";
  sourceIds: string[];
  createdAt: string;
}

export interface MemoryRecord {
  id: string;
  initiativeId: string;
  type:
    | "DECISION"
    | "COMMITMENT"
    | "RISK"
    | "DEPENDENCY"
    | "FACT"
    | "QUESTION";
  statement: string;
  status: "CONFIRMED" | "PROPOSED" | "DISPUTED" | "SUPERSEDED";
  confidence: number;
  sourceIds: string[];
  sourceRunId?: string;
  createdAt: string;
}

export interface Artifact {
  id: string;
  initiativeId: string;
  runId: string;
  type:
    | "PRE_MEETING_BRIEF"
    | "POST_MEETING_SYNTHESIS"
    | "MIND_MAP"
    | "WEEKLY_REVIEW";
  title: string;
  content: string;
  sourceIds: string[];
  version: number;
  createdAt: string;
}

export interface Run {
  id: string;
  initiativeId: string;
  type: RunType;
  intent: string;
  status: RunStatus;
  retrievedSourceIds: string[];
  summary: Record<string, unknown>;
  artifactIds: string[];
  actionIds: string[];
  memoryProposalIds: string[];
  hermesRunId?: string;
  traceId?: string;
  specialistRuns?: Array<{
    role: string;
    runId: string;
    status: string;
  }>;
  coordinatorRunId?: string;
  idempotencyKey: string;
  output?: MosaicRunOutput;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Initiative {
  id: string;
  name: string;
  objective: string;
  description: string;
  successMetrics: string[];
  targetDate: string;
  stage: string;
  health: "ON_TRACK" | "AT_RISK" | "BLOCKED";
  stakeholders: string[];
  createdAt: string;
}
