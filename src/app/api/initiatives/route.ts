import { z } from "zod";
import { error, json } from "@/src/lib/http";
import { db, id } from "@/src/lib/store";

const createSchema = z.object({ name: z.string().min(1), objective: z.string().min(1), successMetrics: z.array(z.string().min(1)).min(1), description: z.string().optional(), targetDate: z.string().optional(), stage: z.string().optional(), stakeholders: z.array(z.string()).optional() });

export function GET() { return json({ data: db.initiatives }); }

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid initiative");
  const value = parsed.data;
  const initiative = { id: id("init"), name: value.name, objective: value.objective, description: value.description ?? "", successMetrics: value.successMetrics, targetDate: value.targetDate ?? "", stage: value.stage ?? "Discovery", health: "ON_TRACK" as const, stakeholders: value.stakeholders ?? [], createdAt: new Date().toISOString() };
  db.initiatives.push(initiative);
  return json({ data: initiative }, { status: 201 });
}
