import "server-only";

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

export type HermesRun = {
  run_id: string;
  status: HermesRunStatus;
  output?: string;
  error?: HermesRunError;
  usage?: HermesUsage;
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

const LUCI_INSTRUCTIONS = [
  "Follow the MOSAIC_RUN contract and use the mosaic-project-manager skill.",
  "Complete every logical specialist stage inside this one Luci run; do not delegate or start subagents.",
  "Return the final JSON directly; do not call execute_code or mutating tools.",
].join(" ");

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
  const apiKey = process.env.HERMES_API_KEY?.trim();
  if (!apiKey) return null;

  const rawBaseUrl = process.env.HERMES_BASE_URL?.trim() || DEFAULT_BASE_URL;
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

function buildMosaicRun(input: StartHermesRunInput, workspacePath: string): string {
  const runType = assertSimpleValue(input.type, "Run type");
  const initiativeId = assertSimpleValue(input.initiativeId, "Initiative ID");
  const intent = assertSimpleValue(input.intent, "Intent");
  const sourcePaths = sourcePathsFor(input.sources);
  const transcript = input.transcript?.trim();

  return [
    "MOSAIC_RUN",
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

export async function startHermesRun(
  input: StartHermesRunInput,
): Promise<StartHermesRunResult> {
  const config = getConfig();
  if (!config) return { configured: false };

  const runId = assertSimpleValue(input.runId, "Run ID");
  const initiativeId = assertSimpleValue(input.initiativeId, "Initiative ID");
  const payload = await requestJson(
    config,
    "/v1/runs",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hermes-Session-Key": `mosaic:initiative:${initiativeId}`,
      },
      body: JSON.stringify({
        input: buildMosaicRun(input, config.workspacePath),
        instructions: LUCI_INSTRUCTIONS,
        session_id: runId,
      }),
    },
    config.submitTimeoutMs,
  );
  const run = parseRun(payload);
  if (run.status !== "started" && run.status !== "running") {
    throw new HermesClientError(
      "invalid_gateway_response",
      "Hermes did not start the run.",
    );
  }

  return {
    configured: true,
    runId: run.run_id,
    status: run.status,
  };
}

export async function getHermesRun(hermesRunId: string): Promise<HermesRun> {
  const config = requireConfig();
  const payload = await requestJson(
    config,
    `/v1/runs/${encodedRunId(hermesRunId)}`,
    { method: "GET" },
    config.pollTimeoutMs,
  );
  return parseRun(payload, hermesRunId);
}

export async function stopHermesRun(hermesRunId: string): Promise<HermesRun> {
  const config = requireConfig();
  const payload = await requestJson(
    config,
    `/v1/runs/${encodedRunId(hermesRunId)}/stop`,
    { method: "POST" },
    config.pollTimeoutMs,
  );
  return parseRun(payload, hermesRunId);
}
