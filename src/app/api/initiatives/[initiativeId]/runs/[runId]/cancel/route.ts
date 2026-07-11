import { error, json } from "@/src/lib/http";
import { cancelRun, RunServiceError } from "@/src/lib/run-service";
import { getInitiative } from "@/src/lib/store";

export async function POST(_: Request, { params }: { params: Promise<{ initiativeId: string; runId: string }> }) {
  const { initiativeId, runId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  try {
    const details = await cancelRun(initiativeId, runId);
    return details ? json({ data: details }) : error("Run not found", 404);
  } catch (cause) {
    if (cause instanceof RunServiceError) {
      return json({ error: cause.message, code: cause.code }, { status: cause.status });
    }
    throw cause;
  }
}
