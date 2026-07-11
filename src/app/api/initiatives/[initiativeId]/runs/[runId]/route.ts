import { error, json } from "@/src/lib/http";
import { db, getInitiative } from "@/src/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ initiativeId: string; runId: string }> }) {
  const { initiativeId, runId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  const run = db.runs.find((item) => item.initiativeId === initiativeId && item.id === runId);
  if (!run) return error("Run not found", 404);
  return json({ data: { run, artifacts: db.artifacts.filter((item) => item.runId === runId), actions: db.actions.filter((item) => item.runId === runId), memoryProposals: db.memory.filter((item) => item.sourceRunId === runId) } });
}
