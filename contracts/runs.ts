export const RUN_TYPES = [
  "PRE_MEETING",
  "POST_MEETING",
  "WEEKLY_REVIEW",
  "GENERAL_SYNTHESIS",
] as const;

export type RunType = (typeof RUN_TYPES)[number];

export const RUN_STATUSES = [
  "CREATED",
  "STARTED",
  "RUNNING",
  "RETRIEVING_CONTEXT",
  "SYNTHESIZING",
  "GENERATING_ARTIFACTS",
  "CURATING_MEMORY",
  "PROPOSING_ACTIONS",
  "WAITING_FOR_APPROVAL",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];
export type TerminalRunStatus = "COMPLETED" | "FAILED" | "CANCELLED";

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

export type CreateRunRequest = {
  type: RunType;
  intent: string;
  transcript?: string;
  sourceIds?: string[];
};

export type MosaicRunOutput = {
  schema_version: "mosaic.run.v1";
  run_type: RunType;
  initiative_id: string;
  executive_summary: string;
  what_changed: Array<{ statement: string; source_ids: string[] }>;
  decisions: Array<{
    statement: string;
    status: "CONFIRMED" | "PROPOSED" | "CONFLICTED";
    source_ids: string[];
  }>;
  commitments: Array<{
    statement: string;
    owner: string | null;
    deadline: string | null;
    source_ids: string[];
  }>;
  risks: Array<{
    statement: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    source_ids: string[];
  }>;
  dependencies: Array<{ statement: string; source_ids: string[] }>;
  open_questions: Array<{ statement: string; source_ids: string[] }>;
  memory_proposals: Array<{
    operation: "ADD" | "CONFIRM" | "DISPUTE" | "SUPERSEDE";
    type:
      | "FACT"
      | "DECISION"
      | "COMMITMENT"
      | "RISK"
      | "DEPENDENCY"
      | "OPEN_QUESTION";
    statement: string;
    supersedes_memory_id: string | null;
    confidence: number;
    source_ids: string[];
  }>;
  actions: Array<{
    title: string;
    description: string;
    owner: string | null;
    deadline: string | null;
    status: "PROPOSED";
    human_assignment_required: boolean;
    human_deadline_required: boolean;
    source_ids: string[];
  }>;
  mermaid: string;
  specialist_trace: Array<{ agent: string; result: string }>;
};

export function isTerminalRunStatus(status: RunStatus): status is TerminalRunStatus {
  return status === "COMPLETED" || status === "FAILED" || status === "CANCELLED";
}
