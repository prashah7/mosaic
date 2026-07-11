import type { AgentType, StartRunRequest } from "@/contracts/runs";

export type HermesTaskInput = {
  runId: string;
  traceId: string;
  agentType: AgentType;
  instruction: string;
  context?: string;
  run: StartRunRequest;
};

export type HermesTaskResult = {
  summary: string;
  context?: string;
};

export interface HermesClient {
  executeTask(input: HermesTaskInput): Promise<HermesTaskResult>;
}

type HermesClientOptions = {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
};

class HttpHermesClient implements HermesClient {
  constructor(private readonly options: HermesClientOptions) {}

  async executeTask(input: HermesTaskInput): Promise<HermesTaskResult> {
    const response = await fetch(`${this.options.baseUrl}/v1/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
        "X-Hermes-Session-Key": `mosaic:initiative:${input.run.initiativeId}`,
        "X-Mosaic-Trace-Id": input.traceId,
      },
      body: JSON.stringify({
        input: input.run.intent,
        instructions: input.instruction,
        context: input.context,
        specialist: input.agentType,
        session_id: input.runId,
      }),
      signal: AbortSignal.timeout(this.options.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Hermes returned HTTP ${response.status}`);
    }

    const payload = await response.json().catch(() => {
      throw new Error("Hermes returned invalid JSON");
    });
    const record = payload && typeof payload === "object"
      ? payload as Record<string, unknown>
      : {};
    const summary = [record.outputSummary, record.summary, record.message]
      .find((value): value is string => typeof value === "string" && value.trim().length > 0)
      ?.trim() ?? `${input.agentType} returned a structured result`;
    const rawContext = [record.context, record.output]
      .find((value): value is string => typeof value === "string" && value.trim().length > 0);

    return {
      summary: summary.slice(0, 500),
      context: rawContext?.slice(0, 50_000),
    };
  }
}

export function createHermesClientFromEnv(): HermesClient | null {
  const apiKey = process.env.HERMES_API_KEY;
  if (!apiKey) return null;

  const configuredTimeout = Number(process.env.HERMES_TIMEOUT_MS ?? "8000");
  const timeoutMs = Number.isFinite(configuredTimeout)
    ? Math.max(1_000, Math.min(configuredTimeout, 60_000))
    : 8_000;

  return new HttpHermesClient({
    apiKey,
    baseUrl: (process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642").replace(/\/$/, ""),
    timeoutMs,
  });
}
