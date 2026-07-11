import { json } from "@/src/lib/http";

export function GET() {
  return json({ ok: true, service: "mosaic-api", timestamp: new Date().toISOString() });
}
