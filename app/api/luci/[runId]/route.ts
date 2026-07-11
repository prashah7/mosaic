import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ runId: string }> },
) {
  const { runId } = await context.params;
  const baseUrl = process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642";
  const apiKey = process.env.HERMES_API_KEY;
  if (!apiKey) return NextResponse.json({ status: "fixture", mode: "fixture" });

  try {
    const response = await fetch(`${baseUrl}/v1/runs/${encodeURIComponent(runId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Hermes-Session-Key": "mosaic:initiative:enterprise-sso",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const result = await response.json();
    return NextResponse.json({ ...result, mode: "hermes" }, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      status: "failed",
      mode: "hermes",
      error: error instanceof Error ? error.message : "Unable to read Hermes run",
    }, { status: 502 });
  }
}
