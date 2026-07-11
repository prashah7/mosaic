type CreateJobInput = {
  runId: string;
  initiativeId: string;
  type: string;
  intent: string;
  transcript?: string;
  sourceIds: string[];
};

export type ConvexJobResult =
  | { status: "created"; response: unknown }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

/**
 * Calls a Convex mutation over its HTTP API. Keep this behind one adapter so
 * the frontend-facing route does not depend on Convex SDK details.
 */
export async function createConvexJob(input: CreateJobInput): Promise<ConvexJobResult> {
  const convexUrl = process.env.CONVEX_URL;
  const functionPath = process.env.CONVEX_CREATE_JOB_FUNCTION ?? "jobs:create";
  const token = process.env.CONVEX_AUTH_TOKEN;

  if (!convexUrl) return { status: "not_configured" };

  try {
    const response = await fetch(`${convexUrl.replace(/\/$/, "")}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        path: functionPath,
        args: {
          runId: input.runId,
          initiativeId: input.initiativeId,
          type: input.type,
          intent: input.intent,
          transcript: input.transcript,
          sourceIds: input.sourceIds,
        },
      }),
      cache: "no-store",
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { status: "failed", error: `Convex returned ${response.status}: ${JSON.stringify(body)}` };
    }
    return { status: "created", response: body };
  } catch (cause) {
    return { status: "failed", error: cause instanceof Error ? cause.message : "Unknown Convex error" };
  }
}
