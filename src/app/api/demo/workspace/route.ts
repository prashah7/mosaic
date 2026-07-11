import { json } from "@/src/lib/http";
import { db } from "@/src/lib/store";

export function GET() {
  return json({ user: { id: "user_maya", name: "Maya Chen", email: "maya@example.com", role: "Product Manager" }, initiatives: db.initiatives });
}
