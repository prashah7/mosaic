import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const initiativeSources = {
  "enterprise-sso": {
    sources: ["data/seed/pm-role.md", "data/seed/company-okrs-q3.md", "data/seed/enterprise-sso-prd.md", "data/seed/enterprise-sso-okrs.md", "data/seed/enterprise-sso-decision-log.md", "data/seed/enterprise-sso-pilot-kickoff.md", "data/seed/enterprise-sso-tickets.json", "data/seed/enterprise-sso-stakeholders.md", "data/seed/slack-thread.json", "data/seed/portfolio-review.md", "data/runtime/memory.json"],
    transcript: "data/seed/identity-architecture-review.md",
  },
  "usage-insights-beta": {
    sources: ["data/seed/pm-role.md", "data/seed/company-okrs-q3.md", "data/seed/usage-insights-brief.md", "data/seed/usage-insights-tickets.json", "data/seed/portfolio-review.md", "data/runtime/usage-insights-memory.json"],
    transcript: "data/seed/usage-insights-review.md",
  },
  "partner-api-v2": {
    sources: ["data/seed/pm-role.md", "data/seed/company-okrs-q3.md", "data/seed/partner-api-v2-brief.md", "data/seed/partner-api-v2-review.md", "data/seed/portfolio-review.md", "data/runtime/partner-api-v2-memory.json"],
    transcript: "data/seed/partner-api-v2-review.md",
  },
} as const;

function buildMosaicRun(body: Record<string, unknown>) {
  const runType = body.runType === "PRE_MEETING" || body.runType === "WEEKLY_REVIEW" ? body.runType : "POST_MEETING";
  const initiativeId = body.initiativeId === "usage-insights-beta" || body.initiativeId === "partner-api-v2" ? body.initiativeId : "enterprise-sso";
  const initiative = initiativeSources[initiativeId];
  const workspacePath = process.env.MOSAIC_WORKSPACE_PATH ?? process.cwd();
  const sourcePaths = runType === "POST_MEETING" && body.sourceMode !== "pasted"
    ? [...initiative.sources, initiative.transcript]
    : initiative.sources;
  const suppliedSource = typeof body.sourceText === "string" && body.sourceText.trim() ? `\nuser_supplied_meeting_source:\n${body.sourceText.trim()}\n` : "";
  const intent = typeof body.intent === "string" && body.intent.trim()
    ? body.intent.trim()
    : runType === "PRE_MEETING" ? "Prepare the PM for the next enterprise SSO meeting."
      : runType === "WEEKLY_REVIEW" ? "Create a complete initiative weekly review."
        : "Synthesize the selected meeting evidence into project state.";

  return [
    "MOSAIC_RUN",
    `mode: ${runType}`,
    `initiative_id: ${initiativeId}`,
    `workspace_path: ${workspacePath}`,
    "source_paths:",
    ...sourcePaths.map((source) => `- ${source}`),
    `intent: ${intent}${suppliedSource}`,
    "Use the mosaic-project-manager skill. Read only the listed sources under workspace_path. Return exactly the schema-valid JSON object required by that skill, with citations for every durable claim. Proposed actions must remain PROPOSED.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const baseUrl = process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642";
  const apiKey = process.env.HERMES_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Luci is not connected to Hermes. Configure HERMES_API_KEY and try again." }, { status: 503 });
  }

  try {
    const response = await fetch(`${baseUrl}/v1/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Hermes-Session-Key": `mosaic:initiative:${body.initiativeId === "usage-insights-beta" || body.initiativeId === "partner-api-v2" ? body.initiativeId : "enterprise-sso"}`,
      },
      body: JSON.stringify({
        input: buildMosaicRun(body),
        instructions: "You are Luci, Mosaic's evidence-backed project-management agent. Follow the MOSAIC_RUN contract and use the installed mosaic-project-manager skill. Never invent an owner or deadline. Return the final JSON directly; do not call execute_code or any mutating tool.",
        session_id: body.runId ?? crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Hermes returned ${response.status}`);
    const result = await response.json();
    return NextResponse.json({ ...result, mode: "hermes" }, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? `Hermes gateway unavailable: ${error.message}` : "Hermes gateway unavailable",
    }, { status: 502 });
  }
}
