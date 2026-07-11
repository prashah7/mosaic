import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { getRuntimeConfig } from "./runtime-config";
import type { Run, RunEvent } from "./types";

export type ConvexSyncResult =
  | { status: "synced" }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

type ConvexRunDocument = {
  mosaicRunId: string;
  initiativeId: string;
  type: Run["type"];
  intent: string;
  status: Run["status"];
  sourceIds: string[];
  idempotencyKey: string;
  hermesRunId?: string;
  traceId?: string;
  specialistRuns?: Run["specialistRuns"];
  coordinatorRunId?: string;
  summary: Record<string, unknown>;
  output?: Run["output"];
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

function createClient() {
  const runtime = getRuntimeConfig();
  const url = runtime.convexUrl;
  if (!url) return null;
  const client = new ConvexHttpClient(url, { logger: false });
  const token = runtime.convexAuthToken;
  if (token) client.setAuth(token);
  return client;
}

const upsertRun = makeFunctionReference<"mutation", ConvexRunDocument, string>("runs:upsert");
const getRun = makeFunctionReference<"query", { mosaicRunId: string }, ConvexRunDocument | null>("runs:get");
const findRunByIdempotency = makeFunctionReference<"query", { idempotencyKey: string }, ConvexRunDocument | null>("runs:findByIdempotency");
const appendEvent = makeFunctionReference<"mutation", {
  eventId: string;
  runId: string;
  sequence: number;
  eventType: string;
  level: RunEvent["level"];
  message: string;
  agentTaskId?: string;
  createdAt: string;
}, string>("runEvents:append");
const listEvents = makeFunctionReference<"query", { runId: string; after?: number }, RunEvent[]>("runEvents:list");

function serializableRun(run: Run): ConvexRunDocument {
  return {
    mosaicRunId: run.id,
    initiativeId: run.initiativeId,
    type: run.type,
    intent: run.intent,
    status: run.status,
    sourceIds: run.retrievedSourceIds,
    idempotencyKey: run.idempotencyKey,
    hermesRunId: run.hermesRunId,
    traceId: run.traceId,
    specialistRuns: run.specialistRuns,
    coordinatorRunId: run.coordinatorRunId,
    summary: run.summary,
    output: run.output,
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    completedAt: run.completedAt,
  };
}

function fromConvexRun(run: ConvexRunDocument | null): Run | null {
  if (!run) return null;
  return {
    id: run.mosaicRunId,
    initiativeId: run.initiativeId,
    type: run.type,
    intent: run.intent,
    status: run.status,
    retrievedSourceIds: run.sourceIds,
    summary: run.summary,
    artifactIds: [],
    actionIds: [],
    memoryProposalIds: [],
    hermesRunId: run.hermesRunId,
    traceId: run.traceId,
    specialistRuns: run.specialistRuns,
    coordinatorRunId: run.coordinatorRunId,
    idempotencyKey: run.idempotencyKey,
    output: run.output,
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    completedAt: run.completedAt,
  };
}

export async function persistRun(run: Run): Promise<ConvexSyncResult> {
  const client = createClient();
  if (!client) return { status: "not_configured" };
  try {
    await client.mutation(upsertRun, serializableRun(run));
    return { status: "synced" };
  } catch (cause) {
    return {
      status: "failed",
      error: cause instanceof Error ? cause.message : "Convex run sync failed",
    };
  }
}

export async function persistRunEvent(event: RunEvent): Promise<ConvexSyncResult> {
  const client = createClient();
  if (!client) return { status: "not_configured" };
  try {
    await client.mutation(appendEvent, {
      eventId: event.id,
      runId: event.runId,
      sequence: event.sequence,
      eventType: event.eventType,
      level: event.level,
      message: event.message,
      agentTaskId: event.agentTaskId,
      createdAt: event.createdAt,
    });
    return { status: "synced" };
  } catch (cause) {
    return {
      status: "failed",
      error: cause instanceof Error ? cause.message : "Convex event sync failed",
    };
  }
}

export async function loadConvexRun(runId: string): Promise<Run | null> {
  const client = createClient();
  if (!client) return null;
  const run = await client.query(getRun, { mosaicRunId: runId }).catch(() => null);
  return fromConvexRun(run);
}

export async function loadRunByIdempotency(key: string): Promise<Run | null> {
  const client = createClient();
  if (!client) return null;
  const run = await client.query(findRunByIdempotency, { idempotencyKey: key }).catch(() => null);
  return fromConvexRun(run);
}

export async function loadConvexEvents(runId: string, after = 0): Promise<RunEvent[]> {
  const client = createClient();
  if (!client) return [];
  return client.query(listEvents, { runId, after }).catch(() => []);
}
