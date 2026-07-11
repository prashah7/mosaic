import { z } from "zod";
import { error, json } from "@/src/lib/http";
import { db, getInitiative, persistDb } from "@/src/lib/store";

const patchSchema = z.object({
  status: z.enum(["CONFIRMED", "PROPOSED", "DISPUTED", "SUPERSEDED"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  return json({ data: db.memory.filter((record) => record.initiativeId === initiativeId) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  const memoryId = new URL(request.url).searchParams.get("memoryId");
  const record = db.memory.find((item) => item.initiativeId === initiativeId && item.id === memoryId);
  if (!record) return error("Memory record not found", 404);
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid memory update");
  Object.assign(record, parsed.data);
  persistDb();
  return json({ data: record });
}
