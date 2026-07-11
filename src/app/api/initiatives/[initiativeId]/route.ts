import { error, json } from "@/src/lib/http";
import { db, getInitiative } from "@/src/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  const initiative = getInitiative(initiativeId);
  if (!initiative) return error("Initiative not found", 404);
  return json({ data: { initiative, sourceCount: db.sources.filter((item) => item.initiativeId === initiativeId).length, runCount: db.runs.filter((item) => item.initiativeId === initiativeId).length, openActionCount: db.actions.filter((item) => item.initiativeId === initiativeId && !["DONE", "VERIFIED"].includes(item.status)).length } });
}
