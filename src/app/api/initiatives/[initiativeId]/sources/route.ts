import { error, json } from "@/src/lib/http";
import { db, getInitiative } from "@/src/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  return json({
    data: db.sources
      .filter((item) => item.initiativeId === initiativeId)
      .map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        excerpt: source.excerpt,
        initiativeId: source.initiativeId,
        createdAt: source.createdAt,
      })),
  });
}
