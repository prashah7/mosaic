import { error, json } from "@/src/lib/http";
import { db, getInitiative } from "@/src/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  return json({ data: db.memory.filter((record) => record.initiativeId === initiativeId) });
}
