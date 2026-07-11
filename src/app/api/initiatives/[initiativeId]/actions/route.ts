import { z } from "zod";
import { error, json } from "@/src/lib/http";
import { db, getInitiative, persistDb } from "@/src/lib/store";

const patchSchema = z.object({ status: z.enum(["PROPOSED", "APPROVED", "IN_PROGRESS", "WAITING", "BLOCKED", "DONE", "VERIFIED"]).optional(), owner: z.string().optional(), deadline: z.string().optional(), priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional() });

export async function GET(_: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  return json({ data: db.actions.filter((action) => action.initiativeId === initiativeId) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  const actionId = new URL(request.url).searchParams.get("actionId");
  const action = db.actions.find((item) => item.initiativeId === initiativeId && item.id === actionId);
  if (!action) return error("Action not found", 404);
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return error("Invalid action update");
  Object.assign(action, parsed.data);
  persistDb();
  return json({ data: action });
}
