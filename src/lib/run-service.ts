import {
  getHermesRun,
  startHermesRun,
  stopHermesRun,
} from "./hermes";
import {
  loadConvexEvents,
  loadConvexRun,
  loadRunByIdempotency,
  persistRun,
  persistRunEvent,
} from "./convex";
import {
  addRunEvent,
  db,
  getRun,
  getRunByIdempotencyKey,
  getRunEvents,
  id,
  upsertRun,
} from "./store";
import { getRuntimeConfig } from "./runtime-config";
import type {
  Action,
  Artifact,
  MemoryRecord,
  MosaicRunOutput,
  Run,
  RunEvent,
  RunStatus,
  RunType,
} from "./types";

type CreateRunInput = {
  initiativeId: string;
  type: RunType;
  intent: string;
  transcript?: string;
  sourceIds: string[];
  idempotencyKey: string;
};

type HermesRecord = Record<string, unknown>;

export class RunServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "RunServiceError";
  }
}

const starts = new Map<string, Promise<{ run: Run; replayed: boolean }>>();

const fixtureOutput: MosaicRunOutput = {
  schema_version: "mosaic.run.v1",
  run_type: "GENERAL_SYNTHESIS",
  initiative_id: "",
  executive_summary: "The initiative is aligned on SAML-first delivery. Audit logging ownership remains the principal launch risk.",
  what_changed: [{ statement: "SCIM was deferred from the first launch.", source_ids: [] }],
  decisions: [{ statement: "Ship SAML first and defer SCIM.", status: "CONFIRMED", source_ids: [] }],
  commitments: [],
  risks: [{ statement: "Audit logging has no assigned owner or implementation ticket.", severity: "HIGH", source_ids: [] }],
  dependencies: [{ statement: "Test Connection must be available before SSO enablement.", source_ids: [] }],
  open_questions: [{ statement: "Who owns audit logging implementation?", source_ids: [] }],
  memory_proposals: [{ operation: "ADD", type: "RISK", statement: "Audit logging is required for launch but has no owner.", supersedes_memory_id: null, confidence: 0.86, source_ids: [] }],
  actions: [{ title: "Assign audit logging owner", description: "Assign an owner and create the implementation ticket before partner go-live.", owner: null, deadline: null, status: "PROPOSED", human_assignment_required: true, human_deadline_required: true, source_ids: [] }],
  mermaid: "mindmap\n  root((Enterprise SSO))\n    Scope\n      SAML first\n      SCIM deferred\n    Readiness\n      Test Connection\n      Audit logging",
  specialist_trace: [
    { agent: "evidence_retriever", result: "Retrieved and grounded the relevant initiative evidence." },
    { agent: "decision_risk_analyst", result: "Reconciled decisions, commitments, and launch risks." },
    { agent: "commitment_action_analyst", result: "Proposed evidence-backed commitments and actions." },
    { agent: "memory_curator", result: "Proposed durable memory updates." },
    { agent: "artifact_generator", result: "Coordinator generated the initiative map." },
  ],
};

function demoEnabled() {
  return getRuntimeConfig().demoFallback;
}

function asRecord(value: unknown): HermesRecord {
  return value !== null && typeof value === "object" ? value as HermesRecord : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function hermesRunId(value: unknown) {
  const record = asRecord(value);
  return stringValue(record.run_id) ?? stringValue(record.runId) ?? stringValue(record.id);
}

function statusFromHermes(value: unknown): RunStatus | undefined {
  const raw = stringValue(asRecord(value).status)?.toLowerCase();
  const statuses: Record<string, RunStatus> = {
    created: "CREATED",
    started: "STARTED",
    running: "RUNNING",
    retrieving_context: "RETRIEVING_CONTEXT",
    synthesizing: "SYNTHESIZING",
    generating_artifacts: "GENERATING_ARTIFACTS",
    curating_memory: "CURATING_MEMORY",
    proposing_actions: "PROPOSING_ACTIONS",
    waiting_for_approval: "WAITING_FOR_APPROVAL",
    completed: "COMPLETED",
    failed: "FAILED",
    cancelled: "CANCELLED",
    canceled: "CANCELLED",
  };
  return raw ? statuses[raw] : undefined;
}

function isTerminal(status: RunStatus) {
  return status === "COMPLETED" || status === "FAILED" || status === "CANCELLED";
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Hermes request failed";
}

async function saveEvent(
  run: Run,
  eventType: string,
  message: string,
  level: RunEvent["level"] = "INFO",
  eventId?: string,
  createdAt?: string,
  agentTaskId?: string,
) {
  const event = addRunEvent(run.id, eventType, message, level, agentTaskId, eventId, createdAt);
  await persistRunEvent(event);
  return event;
}

async function saveRun(run: Run) {
  upsertRun(run);
  await persistRun(run);
  return run;
}

function hydrateRun(run: Run) {
  const existing = getRun(run.id);
  if (existing) return existing;
  return upsertRun({
    ...run,
    artifactIds: run.artifactIds ?? [],
    actionIds: run.actionIds ?? [],
    memoryProposalIds: run.memoryProposalIds ?? [],
  });
}

async function findRun(runId: string) {
  const local = getRun(runId);
  if (local) return local;
  const convex = await loadConvexRun(runId);
  return convex ? hydrateRun(convex) : null;
}

async function findIdempotentRun(key: string) {
  const local = getRunByIdempotencyKey(key);
  if (local) return local;
  const convex = await loadRunByIdempotency(key);
  return convex ? hydrateRun(convex) : null;
}

function outputCandidate(payload: unknown): unknown {
  const record = asRecord(payload);
  return record.output ?? record.result ?? record.final_output ?? record.response;
}

function parseOutput(payload: unknown): MosaicRunOutput {
  let candidate = outputCandidate(payload);
  const nested = asRecord(candidate);
  candidate = nested.content ?? nested.text ?? candidate;
  if (typeof candidate === "string") {
    const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
    candidate = JSON.parse(fenced?.[1] ?? candidate);
  }
  const output = asRecord(candidate);
  if (output.schema_version !== "mosaic.run.v1") {
    throw new Error("Hermes completed without a mosaic.run.v1 output");
  }
  for (const key of ["what_changed", "decisions", "commitments", "risks", "dependencies", "open_questions", "memory_proposals", "actions"] as const) {
    if (!Array.isArray(output[key])) throw new Error(`Invalid mosaic.run.v1 field: ${key}`);
  }
  return output as MosaicRunOutput;
}

function artifactType(type: RunType): Artifact["type"] {
  if (type === "PRE_MEETING") return "PRE_MEETING_BRIEF";
  if (type === "WEEKLY_REVIEW") return "WEEKLY_REVIEW";
  return "POST_MEETING_SYNTHESIS";
}

function materialize(run: Run, output: MosaicRunOutput) {
  if (db.artifacts.some((item) => item.runId === run.id)) return;
  const createdAt = run.completedAt ?? run.updatedAt;
  const primary: Artifact = {
    id: `${run.id}_artifact`, initiativeId: run.initiativeId, runId: run.id,
    type: artifactType(run.type), title: run.type === "PRE_MEETING" ? "Pre-meeting brief" : run.type === "WEEKLY_REVIEW" ? "Weekly review" : "Run synthesis",
    content: JSON.stringify(output, null, 2), sourceIds: run.retrievedSourceIds, version: 1, createdAt,
  };
  const mindMap: Artifact = {
    id: `${run.id}_mind_map`, initiativeId: run.initiativeId, runId: run.id,
    type: "MIND_MAP", title: "Initiative map", content: output.mermaid,
    sourceIds: run.retrievedSourceIds, version: 1, createdAt,
  };
  const actions: Action[] = output.actions.map((action, index) => ({
    id: `${run.id}_action_${index + 1}`, initiativeId: run.initiativeId, runId: run.id,
    title: action.title, description: action.description, owner: action.owner ?? undefined,
    deadline: action.deadline ?? undefined, status: "PROPOSED", priority: "MEDIUM",
    sourceIds: action.source_ids, createdAt,
  }));
  const memories: MemoryRecord[] = output.memory_proposals.map((proposal, index) => ({
    id: `${run.id}_memory_${index + 1}`, initiativeId: run.initiativeId,
    type: proposal.type === "OPEN_QUESTION" ? "QUESTION" : proposal.type,
    statement: proposal.statement,
    status: proposal.operation === "DISPUTE" ? "DISPUTED" : proposal.operation === "SUPERSEDE" ? "SUPERSEDED" : proposal.operation === "CONFIRM" ? "CONFIRMED" : "PROPOSED",
    confidence: proposal.confidence, sourceIds: proposal.source_ids, sourceRunId: run.id, createdAt,
  }));
  db.artifacts.push(primary, mindMap);
  db.actions.push(...actions);
  db.memory.push(...memories);
  run.artifactIds = [primary.id, mindMap.id];
  run.actionIds = actions.map((item) => item.id);
  run.memoryProposalIds = memories.map((item) => item.id);
}

function demoPayload(run: Run) {
  const withSources = (sourceIds: string[]) => sourceIds.length ? sourceIds : run.retrievedSourceIds.slice(0, 2);
  const output = structuredClone(fixtureOutput);
  output.run_type = run.type;
  output.initiative_id = run.initiativeId;
  output.what_changed.forEach((item) => { item.source_ids = withSources(item.source_ids); });
  output.decisions.forEach((item) => { item.source_ids = withSources(item.source_ids); });
  output.risks.forEach((item) => { item.source_ids = withSources(item.source_ids); });
  output.dependencies.forEach((item) => { item.source_ids = withSources(item.source_ids); });
  output.open_questions.forEach((item) => { item.source_ids = withSources(item.source_ids); });
  output.memory_proposals.forEach((item) => { item.source_ids = withSources(item.source_ids); });
  output.actions.forEach((item) => { item.source_ids = withSources(item.source_ids); });
  return { run_id: run.hermesRunId, status: "completed", output };
}

async function syncHermesEvents(run: Run, payload: unknown) {
  const events = asRecord(payload).events;
  if (!Array.isArray(events)) return;
  for (const [index, rawEvent] of events.entries()) {
    const event = asRecord(rawEvent);
    const eventId = `${run.id}_hermes_${stringValue(event.id) ?? index + 1}`;
    const type = stringValue(event.event_type) ?? stringValue(event.type) ?? "HERMES_EVENT";
    const message = stringValue(event.message) ?? stringValue(event.status) ?? type;
    const rawLevel = stringValue(event.level)?.toUpperCase();
    const level: RunEvent["level"] = rawLevel === "ERROR" ? "ERROR" : rawLevel === "WARNING" ? "WARNING" : "INFO";
    await saveEvent(
      run,
      type.toUpperCase(),
      message,
      level,
      eventId,
      stringValue(event.created_at),
      stringValue(event.agent_task_id) ?? stringValue(event.agentTaskId),
    );
  }
}

async function applyHermesState(run: Run, payload: unknown) {
  await syncHermesEvents(run, payload);
  const payloadRecord = asRecord(payload);
  const nextHermesRunId = hermesRunId(payload);
  if (nextHermesRunId && nextHermesRunId !== run.hermesRunId) {
    run.hermesRunId = nextHermesRunId;
  }
  if (Array.isArray(payloadRecord.specialists)) {
    run.specialistRuns = payloadRecord.specialists.flatMap((value) => {
      const specialist = asRecord(value);
      const role = stringValue(specialist.role);
      const childRunId = stringValue(specialist.runId) ?? stringValue(specialist.run_id);
      const status = stringValue(specialist.status);
      return role && childRunId && status ? [{ role, runId: childRunId, status }] : [];
    });
  }
  run.coordinatorRunId = stringValue(payloadRecord.coordinator_run_id) ?? run.coordinatorRunId;
  run.traceId = run.coordinatorRunId ?? run.hermesRunId;
  const nextStatus = statusFromHermes(payload) ?? run.status;
  const now = new Date().toISOString();
  if (nextStatus !== run.status) {
    run.status = nextStatus;
    run.updatedAt = now;
    if (isTerminal(nextStatus)) run.completedAt = now;
    await saveEvent(run, nextStatus, `Run ${nextStatus.toLowerCase().replaceAll("_", " ")}.`);
  }
  if (nextStatus === "FAILED") {
    const error = asRecord(asRecord(payload).error);
    run.errorCode = stringValue(error.code) ?? stringValue(asRecord(payload).error_code) ?? "HERMES_RUN_FAILED";
    run.errorMessage = stringValue(error.message) ?? stringValue(asRecord(payload).error_message) ?? "Hermes run failed";
  }
  if (nextStatus === "COMPLETED" && !run.output) {
    try {
      run.output = parseOutput(payload);
      run.summary = {
        executiveSummary: run.output.executive_summary,
        whatChanged: run.output.what_changed,
        decisions: run.output.decisions,
        risks: run.output.risks,
      };
      materialize(run, run.output);
      await saveEvent(run, "OUTPUT_MATERIALIZED", "Mosaic output materialized.");
    } catch (cause) {
      run.status = "FAILED";
      run.errorCode = "INVALID_MOSAIC_OUTPUT";
      run.errorMessage = errorMessage(cause);
      run.completedAt = now;
      await saveEvent(run, "FAILED", run.errorMessage, "ERROR");
    }
  } else if (run.output) {
    materialize(run, run.output);
  }
  await saveRun(run);
  return run;
}

async function createNewRun(input: CreateRunInput) {
  const existing = await findIdempotentRun(input.idempotencyKey);
  if (existing) return { run: existing, replayed: true };

  const timestamp = new Date().toISOString();
  const run: Run = {
    id: id("run"), initiativeId: input.initiativeId, type: input.type,
    intent: input.intent, status: "CREATED", retrievedSourceIds: input.sourceIds,
    summary: {}, artifactIds: [], actionIds: [], memoryProposalIds: [],
    idempotencyKey: input.idempotencyKey, createdAt: timestamp, updatedAt: timestamp,
  };
  await saveRun(run);
  await saveEvent(run, "CREATED", "Run created.");

  try {
    const started = await startHermesRun({
      runId: run.id,
      initiativeId: input.initiativeId,
      type: input.type,
      intent: input.intent,
      transcript: input.transcript,
      sources: db.sources.filter((source) => input.sourceIds.includes(source.id)),
    });
    const canonicalId = hermesRunId(started);
    if (!canonicalId) throw new Error("Hermes start response did not include run_id");
    run.hermesRunId = canonicalId;
    run.traceId = canonicalId;
    const startedRecord = asRecord(started);
    if (Array.isArray(startedRecord.specialists)) {
      run.specialistRuns = startedRecord.specialists.flatMap((value) => {
        const specialist = asRecord(value);
        const role = stringValue(specialist.role);
        const childRunId = stringValue(specialist.runId);
        const status = stringValue(specialist.status);
        return role && childRunId && status ? [{ role, runId: childRunId, status }] : [];
      });
    }
    run.status = statusFromHermes(started) ?? "STARTED";
    run.updatedAt = new Date().toISOString();
    await saveEvent(run, "STARTED", "Hermes run started.");
    await saveRun(run);
    return { run, replayed: false };
  } catch (cause) {
    if (demoEnabled()) {
      run.hermesRunId = `demo_${run.id}`;
      run.traceId = run.hermesRunId;
      run.status = "STARTED";
      run.updatedAt = new Date().toISOString();
      await saveEvent(run, "STARTED", "Deterministic demo run started.", "WARNING");
      for (const role of ["evidence_retriever", "decision_risk_analyst", "commitment_action_analyst", "memory_curator"]) {
        await saveEvent(run, "SPECIALIST_COMPLETED", `${role} specialist completed.`, "INFO", `${run.id}:${role}`, undefined, role);
      }
      await saveEvent(run, "COORDINATOR_STARTED", "Coordinator started.", "INFO", `${run.id}:coordinator`, undefined, "artifact_generator");
      await saveRun(run);
      return { run, replayed: false };
    }
    run.status = "FAILED";
    run.errorCode = "HERMES_UNAVAILABLE";
    run.errorMessage = errorMessage(cause);
    run.updatedAt = new Date().toISOString();
    run.completedAt = run.updatedAt;
    await saveEvent(run, "FAILED", run.errorMessage, "ERROR");
    await saveRun(run);
    throw new RunServiceError("HERMES_UNAVAILABLE", run.errorMessage, 503);
  }
}

export async function createRun(input: CreateRunInput) {
  const existing = await findIdempotentRun(input.idempotencyKey);
  if (existing) return { run: existing, replayed: true };
  const pending = starts.get(input.idempotencyKey);
  if (pending) return pending.then(({ run }) => ({ run, replayed: true }));
  const operation = createNewRun(input);
  starts.set(input.idempotencyKey, operation);
  try {
    return await operation;
  } finally {
    starts.delete(input.idempotencyKey);
  }
}

export async function refreshRun(initiativeId: string, runId: string) {
  const run = await findRun(runId);
  if (!run || run.initiativeId !== initiativeId) return null;
  const convexEvents = await loadConvexEvents(run.id);
  for (const event of convexEvents) {
    addRunEvent(run.id, event.eventType, event.message, event.level, event.agentTaskId, event.id, event.createdAt);
  }
  if (!isTerminal(run.status) && run.hermesRunId) {
    if (run.hermesRunId.startsWith("demo_")) {
      await applyHermesState(run, demoPayload(run));
    } else {
      try {
        await applyHermesState(run, await getHermesRun(run.hermesRunId));
      } catch (cause) {
        throw new RunServiceError("HERMES_UNAVAILABLE", errorMessage(cause), 503);
      }
    }
  } else if (run.output) {
    materialize(run, run.output);
  }
  return runDetails(run);
}

export async function cancelRun(initiativeId: string, runId: string) {
  const run = await findRun(runId);
  if (!run || run.initiativeId !== initiativeId) return null;
  if (isTerminal(run.status)) return runDetails(run);
  try {
    if (run.hermesRunId && !run.hermesRunId.startsWith("demo_")) {
      await stopHermesRun(run.hermesRunId);
    }
  } catch (cause) {
    throw new RunServiceError("HERMES_STOP_FAILED", errorMessage(cause), 502);
  }
  run.status = "CANCELLED";
  run.updatedAt = new Date().toISOString();
  run.completedAt = run.updatedAt;
  await saveEvent(run, "CANCELLED", "Run cancelled.", "WARNING");
  await saveRun(run);
  return runDetails(run);
}

export function runDetails(run: Run) {
  return {
    run,
    events: getRunEvents(run.id),
    artifacts: db.artifacts.filter((item) => item.runId === run.id),
    actions: db.actions.filter((item) => item.runId === run.id),
    memoryProposals: db.memory.filter((item) => item.sourceRunId === run.id),
  };
}
