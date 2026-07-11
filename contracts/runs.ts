export const RUN_TYPES = [
  "PRE_MEETING",
  "POST_MEETING",
  "WEEKLY_REVIEW",
  "GENERAL_SYNTHESIS",
] as const;

export type RunType = (typeof RUN_TYPES)[number];
export type RuntimeMode = "hermes" | "fixture";
export type RunStatus = "COMPLETED" | "DEGRADED";

export const AGENT_TYPES = [
  "CONTEXT_RETRIEVER",
  "SYNTHESIZER",
  "ARTIFACT_GENERATOR",
  "MEMORY_CURATOR",
  "ACTION_MANAGER",
] as const;

export type AgentType = (typeof AGENT_TYPES)[number];
export type AgentTaskStatus = "WAITING" | "RUNNING" | "COMPLETED" | "FAILED";

export type StartRunRequest = {
  initiativeId: string;
  intent: string;
  runId?: string;
  type: RunType;
};

export type AgentTaskSnapshot = {
  id: string;
  agentType: AgentType;
  status: AgentTaskStatus;
  durationMs?: number;
  outputSummary?: string;
  errorMessage?: string;
};

export type RunEvent = {
  id: string;
  runId: string;
  traceId: string;
  sequence: number;
  eventType: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  agentTaskId?: string;
  createdAt: string;
};

export type StartRunResponse = {
  runId: string;
  traceId: string;
  mode: RuntimeMode;
  status: RunStatus;
  message: string;
  tasks: AgentTaskSnapshot[];
  events: RunEvent[];
};

export class RunContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunContractError";
  }
}

const runTypeAliases: Record<string, RunType> = {
  "pre-meeting": "PRE_MEETING",
  "post-meeting": "POST_MEETING",
  "weekly review": "WEEKLY_REVIEW",
  "general synthesis": "GENERAL_SYNTHESIS",
};

function requiredString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RunContractError(`${key} is required`);
  }
  if (value.length > maxLength) {
    throw new RunContractError(`${key} must be at most ${maxLength} characters`);
  }
  return value.trim();
}

function optionalRunType(value: unknown): RunType {
  if (value === undefined) return "POST_MEETING";
  if (typeof value !== "string") {
    throw new RunContractError("type must be a string");
  }

  const normalized = value.trim();
  if ((RUN_TYPES as readonly string[]).includes(normalized)) {
    return normalized as RunType;
  }

  const alias = runTypeAliases[normalized.toLowerCase()];
  if (alias) return alias;
  throw new RunContractError(`type must be one of ${RUN_TYPES.join(", ")}`);
}

export function parseStartRunRequest(input: unknown): StartRunRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new RunContractError("request body must be a JSON object");
  }

  const record = input as Record<string, unknown>;
  const runId = record.runId;
  if (runId !== undefined && (typeof runId !== "string" || runId.length > 128)) {
    throw new RunContractError("runId must be a string of at most 128 characters");
  }

  return {
    initiativeId: requiredString(record, "initiativeId", 128),
    intent: requiredString(record, "intent", 10_000),
    runId: typeof runId === "string" && runId.trim() ? runId.trim() : undefined,
    type: optionalRunType(record.type),
  };
}
