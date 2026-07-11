import "server-only";

import { getRuntimeConfig } from "./runtime-config";
import type { RunType } from "./types";

export type HermesRunStatus =
  | "started"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "waiting_for_approval";

export type HermesRunError = {
  code: string;
  message: string;
};

export type HermesUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

export type HermesSpecialistRole =
  | "evidence_retriever"
  | "decision_risk_analyst"
  | "commitment_action_analyst"
  | "memory_curator";

export const MOSAIC_AGENT_ROLES = [
  "evidence_retriever",
  "decision_risk_analyst",
  "commitment_action_analyst",
  "memory_curator",
  "artifact_generator",
] as const;

export type HermesSpecialistRun = {
  role: HermesSpecialistRole;
  runId: string;
  status: HermesRunStatus;
};

export type HermesRunEvent = {
  id: string;
  event_type: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  agent_task_id?: string;
  created_at?: string;
};

export type HermesRun = {
  run_id: string;
  status: HermesRunStatus;
  output?: string;
  error?: HermesRunError;
  usage?: HermesUsage;
  events?: HermesRunEvent[];
  specialists?: HermesSpecialistRun[];
  coordinator_run_id?: string;
};

export type StartHermesRunInput = {
  runId: string;
  initiativeId: string;
  type: RunType;
  intent: string;
  transcript?: string;
  sources: readonly (string | { readonly id: string })[];
};

export type StartHermesRunResult =
  | { configured: false }
  | {
      configured: true;
      runId: string;
      status: "started" | "running";
      specialists: HermesSpecialistRun[];
    };

export type HermesClientErrorCode =
  | "gateway_timeout"
  | "gateway_unavailable"
  | "hermes_not_configured"
  | "invalid_gateway_response"
  | "invalid_hermes_config"
  | "invalid_hermes_run_id"
  | "invalid_mosaic_run"
  | "unknown_source_id"
  | (string & {});

export class HermesClientError extends Error {
  readonly code: HermesClientErrorCode;
  readonly httpStatus?: number;

  constructor(
    code: HermesClientErrorCode,
    message: string,
    options: { httpStatus?: number } = {},
  ) {
    super(message);
    this.name = "HermesClientError";
    this.code = code;
    this.httpStatus = options.httpStatus;
  }
}

const SOURCE_PATH_BY_ID: Readonly<Record<string, string>> = {
  src_rr: "data/seed/pm-role.md",
  src_prd: "data/seed/enterprise-sso-prd.md",
  src_prior: "data/seed/enterprise-sso-pilot-kickoff.md",
  src_transcript: "data/seed/identity-architecture-review.md",
  src_tickets: "data/seed/enterprise-sso-tickets.json",
  src_slack: "data/seed/slack-thread.json",
  src_decisions: "data/seed/enterprise-sso-decision-log.md",
};

const RUNTIME_MEMORY_PATH = "data/runtime/memory.json";
const DEFAULT_BASE_URL = "http://127.0.0.1:8642";
const DEFAULT_SUBMIT_TIMEOUT_MS = 8_000;
const DEFAULT_POLL_TIMEOUT_MS = 5_000;
const MIN_TIMEOUT_MS = 250;
const MAX_TIMEOUT_MS = 120_000;

const SPECIALISTS: ReadonlyArray<{
  role: HermesSpecialistRole;
  label: string;
  objective: string;
}> = [
  {
    role: "evidence_retriever",
    label: "Context and evidence",
    objective:
      "Retrieve relevant evidence, summarize what changed, and identify dependencies and open questions with source IDs.",
  },
  {
    role: "decision_risk_analyst",
    label: "Decision and risk",
    objective:
      "Identify confirmed, proposed, or conflicted decisions and assess evidence-backed risks and commitments.",
  },
  {
    role: "commitment_action_analyst",
    label: "Commitment and action",
    objective:
      "Extract commitments and propose evidence-backed actions without inventing owners, deadlines, or decisions.",
  },
  {
    role: "memory_curator",
    label: "Memory curator",
    objective:
      "Compare evidence with canonical memory and propose additions, confirmations, disputes, or supersessions.",
  },
];

const SPECIALIST_INSTRUCTIONS = [
  "Follow the MOSAIC_RUN specialist contract and use the mosaic-project-manager skill.",
  "Perform only the assigned specialist role and return one compact JSON object.",
  "Do not create subagents, mutate files, or reveal hidden reasoning.",
].join(" ");

const COORDINATOR_INSTRUCTIONS = [
  "Follow the MOSAIC_RUN coordinator contract and use the mosaic-project-manager skill.",
  "Reconcile the supplied specialist results into exactly one canonical mosaic.run.v1 JSON object.",
  "Do not create subagents, mutate files, or reveal hidden reasoning.",
].join(" ");

type MultiAgentState = {
  version: 1;
  mosaicRunId: string;
  initiativeId: string;
  runType: RunType;
  intent: string;
  specialists: Array<{ role: HermesSpecialistRole; runId: string }>;
  coordinatorRunId?: string;
};

const MULTI_AGENT_PREFIX = "mosaic-ma:";
const coordinatorStarts = new Map<string, Promise<HermesRun>>();

type HermesConfig = {
  baseUrl: string;
  apiKey: string;
  workspacePath: string;
  submitTimeoutMs: number;
  pollTimeoutMs: number;
};

function timeoutFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.floor(parsed)));
}

function getConfig(): HermesConfig | null {
  const runtime = getRuntimeConfig();
  const apiKey = runtime.hermesApiKey?.trim();
  if (!apiKey) return null;

  const rawBaseUrl = runtime.hermesBaseUrl?.trim() || DEFAULT_BASE_URL;
  let baseUrl: URL;
  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new HermesClientError(
      "invalid_hermes_config",
      "The Hermes gateway URL is invalid.",
    );
  }
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new HermesClientError(
      "invalid_hermes_config",
      "The Hermes gateway URL must use HTTP or HTTPS.",
    );
  }

  const workspacePath =
    process.env.HERMES_WORKSPACE_PATH?.trim() || process.cwd();

  return {
    apiKey,
    baseUrl: baseUrl.toString().replace(/\/$/, ""),
    workspacePath,
    submitTimeoutMs: timeoutFromEnv(
      "HERMES_SUBMIT_TIMEOUT_MS",
      DEFAULT_SUBMIT_TIMEOUT_MS,
    ),
    pollTimeoutMs: timeoutFromEnv(
      "HERMES_POLL_TIMEOUT_MS",
      DEFAULT_POLL_TIMEOUT_MS,
    ),
  };
}

function requireConfig(): HermesConfig {
  const config = getConfig();
  if (!config) {
    throw new HermesClientError(
      "hermes_not_configured",
      "Hermes is not configured.",
    );
  }
  return config;
}

function assertSimpleValue(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || /[\r\n]/.test(normalized)) {
    throw new HermesClientError(
      "invalid_mosaic_run",
      `${label} must be a non-empty single-line value.`,
    );
  }
  return normalized;
}

function sourcePathsFor(
  sources: readonly (string | { readonly id: string })[],
): string[] {
  const paths = sources.map((source) => {
    const sourceId = typeof source === "string" ? source : source.id;
    const path = SOURCE_PATH_BY_ID[sourceId];
    if (!path) {
      throw new HermesClientError(
        "unknown_source_id",
        "One or more Mosaic sources are not available to Hermes.",
      );
    }
    return path;
  });

  return [...new Set([...paths, RUNTIME_MEMORY_PATH])];
}

function buildSpecialistRun(
  input: StartHermesRunInput,
  workspacePath: string,
  specialist: (typeof SPECIALISTS)[number],
): string {
  const runType = assertSimpleValue(input.type, "Run type");
  const initiativeId = assertSimpleValue(input.initiativeId, "Initiative ID");
  const intent = assertSimpleValue(input.intent, "Intent");
  const sourcePaths = sourcePathsFor(input.sources);
  const transcript = input.transcript?.trim();

  return [
    "MOSAIC_RUN",
    "execution_role: SPECIALIST",
    `specialist_role: ${specialist.role}`,
    `specialist_objective: ${specialist.objective}`,
    `mode: ${runType}`,
    `initiative_id: ${initiativeId}`,
    `workspace_path: ${workspacePath}`,
    "source_paths:",
    ...sourcePaths.map((path) => `- ${path}`),
    ...(transcript
      ? ["transcript: |", ...transcript.split(/\r?\n/).map((line) => `  ${line}`)]
      : []),
    `intent: ${intent}`,
  ].join("\n");
}

function buildCoordinatorRun(
  state: MultiAgentState,
  specialistRuns: HermesRun[],
): string {
  const specialistResults = state.specialists.map((specialist, index) => ({
    agent: specialist.role,
    run_id: specialist.runId,
    status: specialistRuns[index]?.status ?? "failed",
    result: specialistRuns[index]?.output ?? "",
  }));

  return [
    "MOSAIC_RUN",
    "execution_role: COORDINATOR",
    `mode: ${state.runType}`,
    `initiative_id: ${state.initiativeId}`,
    `intent: ${state.intent}`,
    "specialist_results_json:",
    JSON.stringify(specialistResults),
    "Return exactly one canonical mosaic.run.v1 JSON object. Preserve every child run in specialist_trace, including failed or cancelled specialists, and clearly disclose partial success in executive_summary.",
  ].join("\n");
}

function encodeState(state: MultiAgentState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `${MULTI_AGENT_PREFIX}${btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")}`;
}

function decodeState(value: string): MultiAgentState | null {
  if (!value.startsWith(MULTI_AGENT_PREFIX)) return null;
  try {
    const encoded = value.slice(MULTI_AGENT_PREFIX.length)
      .replaceAll("-", "+")
      .replaceAll("_", "/");
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      typeof parsed.mosaicRunId !== "string" ||
      typeof parsed.initiativeId !== "string" ||
      typeof parsed.runType !== "string" ||
      typeof parsed.intent !== "string" ||
      !Array.isArray(parsed.specialists)
    ) {
      throw new Error("invalid state");
    }
    const specialists = parsed.specialists.map((value) => {
      if (
        !isRecord(value) ||
        !SPECIALISTS.some((specialist) => specialist.role === value.role) ||
        typeof value.runId !== "string"
      ) {
        throw new Error("invalid specialist state");
      }
      return {
        role: value.role as HermesSpecialistRole,
        runId: value.runId,
      };
    });
    return {
      version: 1,
      mosaicRunId: parsed.mosaicRunId,
      initiativeId: parsed.initiativeId,
      runType: parsed.runType as RunType,
      intent: parsed.intent,
      specialists,
      coordinatorRunId:
        typeof parsed.coordinatorRunId === "string"
          ? parsed.coordinatorRunId
          : undefined,
    };
  } catch {
    throw new HermesClientError(
      "invalid_hermes_run_id",
      "The Hermes orchestration ID is invalid.",
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeGatewayCode(payload: unknown): string | undefined {
  if (!isRecord(payload) || !isRecord(payload.error)) return undefined;
  const code = payload.error.code;
  return typeof code === "string" && /^[a-z0-9_-]{1,64}$/i.test(code)
    ? code
    : undefined;
}

function gatewayError(response: Response, payload: unknown): HermesClientError {
  const upstreamCode = safeGatewayCode(payload);
  const code = upstreamCode || `hermes_http_${response.status}`;
  let message = "Hermes rejected the request.";

  if (response.status === 401 || response.status === 403) {
    message = "Hermes authentication failed.";
  } else if (response.status === 404) {
    message = "The Hermes run was not found.";
  } else if (response.status === 429) {
    message = "Hermes is temporarily busy.";
  } else if (response.status >= 500) {
    message = "Hermes is currently unavailable.";
  }

  return new HermesClientError(code, message, { httpStatus: response.status });
}

async function requestJson(
  config: HermesConfig,
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...init.headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => undefined);
    if (!response.ok) throw gatewayError(response, payload);
    if (payload === undefined) {
      throw new HermesClientError(
        "invalid_gateway_response",
        "Hermes returned an invalid response.",
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof HermesClientError) throw error;
    if (controller.signal.aborted) {
      throw new HermesClientError(
        "gateway_timeout",
        "The Hermes request timed out.",
      );
    }
    throw new HermesClientError(
      "gateway_unavailable",
      "Hermes is currently unavailable.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function readRunStatus(value: unknown): HermesRunStatus {
  switch (value) {
    case "started":
    case "queued":
      return "started";
    case "running":
    case "in_progress":
    case "stopping":
      return "running";
    case "completed":
    case "failed":
    case "cancelled":
    case "waiting_for_approval":
      return value;
    default:
      throw new HermesClientError(
        "invalid_gateway_response",
        "Hermes returned an unsupported run status.",
      );
  }
}

function readRunError(value: unknown): HermesRunError | undefined {
  if (typeof value === "string" && value.trim()) {
    return { code: "hermes_run_failed", message: "The Hermes run failed." };
  }
  if (!isRecord(value)) return undefined;

  const code =
    typeof value.code === "string" && /^[a-z0-9_-]{1,64}$/i.test(value.code)
      ? value.code
      : "hermes_run_failed";
  return { code, message: "The Hermes run failed." };
}

function readUsage(value: unknown): HermesUsage | undefined {
  if (!isRecord(value)) return undefined;
  const usage: HermesUsage = {};

  for (const key of ["input_tokens", "output_tokens", "total_tokens"] as const) {
    const count = value[key];
    if (typeof count === "number" && Number.isFinite(count) && count >= 0) {
      usage[key] = count;
    }
  }

  return Object.keys(usage).length ? usage : undefined;
}

function parseRun(payload: unknown, fallbackRunId?: string): HermesRun {
  if (!isRecord(payload)) {
    throw new HermesClientError(
      "invalid_gateway_response",
      "Hermes returned an invalid run.",
    );
  }

  const runId =
    typeof payload.run_id === "string" && payload.run_id.trim()
      ? payload.run_id
      : fallbackRunId;
  if (!runId) {
    throw new HermesClientError(
      "invalid_gateway_response",
      "Hermes returned a run without an ID.",
    );
  }

  const result: HermesRun = {
    run_id: runId,
    status: readRunStatus(payload.status),
  };
  if (typeof payload.output === "string") result.output = payload.output;
  const error = readRunError(payload.error);
  if (error) result.error = error;
  const usage = readUsage(payload.usage);
  if (usage) result.usage = usage;
  return result;
}

function encodedRunId(hermesRunId: string): string {
  const runId = hermesRunId.trim();
  if (!runId || runId.length > 256 || /[\r\n]/.test(runId)) {
    throw new HermesClientError(
      "invalid_hermes_run_id",
      "The Hermes run ID is invalid.",
    );
  }
  return encodeURIComponent(runId);
}

async function submitHermesRun(
  config: HermesConfig,
  input: string,
  instructions: string,
  sessionId: string,
  sessionKey: string,
) {
  const payload = await requestJson(config, "/v1/runs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hermes-Session-Key": sessionKey,
    },
    body: JSON.stringify({ input, instructions, session_id: sessionId }),
  }, config.submitTimeoutMs);
  const run = parseRun(payload);
  if (run.status !== "started" && run.status !== "running") {
    throw new HermesClientError("invalid_gateway_response", "Hermes did not start the run.");
  }
  return run;
}

async function fetchHermesRun(config: HermesConfig, runId: string) {
  const payload = await requestJson(
    config,
    `/v1/runs/${encodedRunId(runId)}`,
    { method: "GET" },
    config.pollTimeoutMs,
  );
  return parseRun(payload, runId);
}

async function stopChildRun(config: HermesConfig, runId: string) {
  const payload = await requestJson(
    config,
    `/v1/runs/${encodedRunId(runId)}/stop`,
    { method: "POST" },
    config.pollTimeoutMs,
  );
  return parseRun(payload, runId);
}

async function startCoordinator(
  config: HermesConfig,
  state: MultiAgentState,
  specialistResults: HermesRun[],
) {
  const existing = coordinatorStarts.get(state.mosaicRunId);
  if (existing) return existing;

  const operation = submitHermesRun(
    config,
    buildCoordinatorRun(state, specialistResults),
    COORDINATOR_INSTRUCTIONS,
    `${state.mosaicRunId}:coordinator`,
    `mosaic:initiative:${state.initiativeId}:coordinator`,
  );
  coordinatorStarts.set(state.mosaicRunId, operation);
  try {
    return await operation;
  } finally {
    coordinatorStarts.delete(state.mosaicRunId);
  }
}

function orchestrationEvents(
  specialists: HermesSpecialistRun[],
  coordinator?: HermesRun,
): HermesRunEvent[] {
  const events: HermesRunEvent[] = specialists.map((specialist) => ({
    id: `${specialist.runId}:${specialist.status}`,
    event_type: `SPECIALIST_${specialist.status.toUpperCase()}`,
    level: specialist.status === "failed" ? "ERROR" as const : "INFO" as const,
    message: `${specialist.role} specialist ${specialist.status.replaceAll("_", " ")} (trace ${specialist.runId}).`,
    agent_task_id: specialist.role,
  }));
  if (coordinator) {
    events.push({
      id: `${coordinator.run_id}:${coordinator.status}`,
      event_type: `COORDINATOR_${coordinator.status.toUpperCase()}`,
      level: coordinator.status === "failed" ? "ERROR" : "INFO",
      message: `Coordinator ${coordinator.status.replaceAll("_", " ")} (trace ${coordinator.run_id}).`,
      agent_task_id: "artifact_generator",
    });
  }
  return events;
}

export async function startHermesRun(input: StartHermesRunInput): Promise<StartHermesRunResult> {
  const config = getConfig();
  if (!config) return { configured: false };
  const mosaicRunId = assertSimpleValue(input.runId, "Run ID");
  const initiativeId = assertSimpleValue(input.initiativeId, "Initiative ID");
  const starts = await Promise.allSettled(SPECIALISTS.map((specialist) =>
    submitHermesRun(
      config,
      buildSpecialistRun(input, config.workspacePath, specialist),
      SPECIALIST_INSTRUCTIONS,
      `${mosaicRunId}:${specialist.role}`,
      `mosaic:initiative:${initiativeId}:${specialist.role}`,
    ),
  ));
  const failed = starts.find((result) => result.status === "rejected");
  if (failed) {
    await Promise.allSettled(starts.flatMap((result) =>
      result.status === "fulfilled" ? [stopChildRun(config, result.value.run_id)] : [],
    ));
    throw failed.reason;
  }
  const specialists = starts.map((result, index) => ({
    role: SPECIALISTS[index].role,
    runId: (result as PromiseFulfilledResult<HermesRun>).value.run_id,
    status: (result as PromiseFulfilledResult<HermesRun>).value.status,
  }));
  const runId = encodeState({
    version: 1,
    mosaicRunId,
    initiativeId,
    runType: input.type,
    intent: input.intent,
    specialists: specialists.map(({ role, runId }) => ({ role, runId })),
  });
  return { configured: true, runId, status: "running", specialists };
}

export async function getHermesRun(hermesRunId: string): Promise<HermesRun> {
  const config = requireConfig();
  const state = decodeState(hermesRunId);
  if (!state) return fetchHermesRun(config, hermesRunId);

  const specialistResults = await Promise.all(state.specialists.map(({ runId }) => fetchHermesRun(config, runId)));
  const specialists = state.specialists.map((specialist, index) => ({
    ...specialist,
    status: specialistResults[index].status,
  }));
  if (specialistResults.some((run) => run.status === "waiting_for_approval")) {
    return { run_id: hermesRunId, status: "waiting_for_approval", specialists, events: orchestrationEvents(specialists) };
  }
  const settled = specialistResults.every((run) =>
    run.status === "completed" || run.status === "failed" || run.status === "cancelled",
  );
  if (!settled) {
    return { run_id: hermesRunId, status: "running", specialists, events: orchestrationEvents(specialists) };
  }
  const successfulSpecialists = specialistResults.filter((run) => run.status === "completed" && run.output);
  if (successfulSpecialists.length === 0) {
    const cancelled = specialistResults.every((run) => run.status === "cancelled");
    return {
      run_id: hermesRunId,
      status: cancelled ? "cancelled" : "failed",
      error: cancelled ? undefined : { code: "all_specialists_failed", message: "The Hermes specialists failed." },
      specialists,
      events: orchestrationEvents(specialists),
    };
  }

  if (!state.coordinatorRunId) {
    if (specialistResults.some((run) => run.status === "completed" && !run.output)) {
      throw new HermesClientError("invalid_gateway_response", "A Hermes specialist completed without output.");
    }
    const coordinator = await startCoordinator(config, state, specialistResults);
    const nextId = encodeState({ ...state, coordinatorRunId: coordinator.run_id });
    return {
      run_id: nextId,
      status: coordinator.status,
      specialists,
      coordinator_run_id: coordinator.run_id,
      events: orchestrationEvents(specialists, coordinator),
    };
  }

  const coordinator = await fetchHermesRun(config, state.coordinatorRunId);
  return {
    ...coordinator,
    run_id: hermesRunId,
    specialists,
    coordinator_run_id: coordinator.run_id,
    events: orchestrationEvents(specialists, coordinator),
  };
}

export async function stopHermesRun(hermesRunId: string): Promise<HermesRun> {
  const config = requireConfig();
  const state = decodeState(hermesRunId);
  if (!state) return stopChildRun(config, hermesRunId);
  const runIds = [
    ...state.specialists.map(({ runId }) => runId),
    ...(state.coordinatorRunId ? [state.coordinatorRunId] : []),
  ];
  await Promise.allSettled(runIds.map((runId) => stopChildRun(config, runId)));
  const specialists = state.specialists.map((specialist) => ({ ...specialist, status: "cancelled" as const }));
  return { run_id: hermesRunId, status: "cancelled", specialists, events: orchestrationEvents(specialists) };
}
