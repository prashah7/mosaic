import { z } from "zod";
import { error, json } from "@/src/lib/http";
import { createRun, RunServiceError, runDetails } from "@/src/lib/run-service";
import { db, getInitiative } from "@/src/lib/store";

const runSchema = z.object({
  type: z.enum(["PRE_MEETING", "POST_MEETING", "WEEKLY_REVIEW", "GENERAL_SYNTHESIS"]),
  intent: z.string().trim().min(1).max(4_000),
  transcript: z.string().max(200_000).optional(),
  sourceIds: z.array(z.string().min(1)).max(100).optional(),
}).strict();

export async function GET(_: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  return json({ data: db.runs.filter((run) => run.initiativeId === initiativeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}

export async function POST(request: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (!idempotencyKey) return error("Idempotency-Key header is required", 400);
  if (idempotencyKey.length > 200) return error("Idempotency-Key is too long", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Request body must be valid JSON", 400);
  }
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid run", 400);
  const sourceIds = parsed.data.sourceIds?.length
    ? [...new Set(parsed.data.sourceIds)]
    : db.sources.filter((source) => source.initiativeId === initiativeId).map((source) => source.id);
  if (sourceIds.some((sourceId) => !db.sources.some((source) => source.id === sourceId && source.initiativeId === initiativeId))) {
    return error("One or more sourceIds do not belong to this initiative", 400);
  }

  try {
    const { run, replayed } = await createRun({
      initiativeId,
      type: parsed.data.type,
      intent: parsed.data.intent,
      transcript: parsed.data.transcript,
      sourceIds,
      idempotencyKey,
    });
    return json({ data: runDetails(run), replayed }, { status: 202 });
  } catch (cause) {
    if (cause instanceof RunServiceError) {
      return json({ error: cause.message, code: cause.code }, { status: cause.status });
    }
    throw cause;
  }
}
