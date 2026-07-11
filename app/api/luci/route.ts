import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const fallbackResult = {
  runId: "run_identity_architecture_003",
  mode: "fixture",
  status: "accepted",
  message: "Hermes gateway is unavailable; the schema-valid buildathon fixture will drive this run.",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const baseUrl = process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642";
  const apiKey = process.env.HERMES_API_KEY;

  if (!apiKey) return NextResponse.json(fallbackResult);

  try {
    const response = await fetch(`${baseUrl}/v1/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Hermes-Session-Key": `mosaic:initiative:${body.initiativeId ?? "enterprise-sso"}`,
      },
      body: JSON.stringify({
        input: body.intent,
        instructions: "You are Luci, Mosaic's evidence-backed project-management agent. Return concise structured project changes, citations, memory proposals, and actions. Never invent an owner or deadline.",
        session_id: body.runId ?? crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Hermes returned ${response.status}`);
    const result = await response.json();
    return NextResponse.json({ ...result, mode: "hermes" }, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      ...fallbackResult,
      gateway_error: error instanceof Error ? error.message : "Hermes gateway unavailable",
    });
  }
}
