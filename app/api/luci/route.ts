import { NextRequest, NextResponse } from "next/server";

import {
  parseStartRunRequest,
  RunContractError,
} from "@/contracts/runs";
import { startLuciRun } from "@/server/runs/orchestrator";

export const runtime = "nodejs";

const seedSources = [
  "data/seed/pm-role.md",
  "data/seed/enterprise-sso-prd.md",
  "data/seed/identity-architecture-review.md",
  "data/seed/slack-thread.json",
  "data/runtime/memory.json",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const input = parseStartRunRequest(body);
    const baseUrl = process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642";
    const apiKey = process.env.HERMES_API_KEY;

    if (!apiKey) {
      return NextResponse.json(await startLuciRun(input, null), { status: 202 });
    }

    const runId = input.runId ?? crypto.randomUUID();
    const workspacePath = process.env.HERMES_WORKSPACE_PATH ?? process.cwd();
    const hermesInput = [
      "MOSAIC_RUN",
      `mode: ${input.type}`,
      `initiative_id: ${input.initiativeId}`,
      `workspace_path: ${workspacePath}`,
      `intent: ${input.intent}`,
      `sources: ${seedSources.join(", ")}`,
    ].join("\n");

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Hermes-Session-Key": `mosaic:initiative:${input.initiativeId}`,
        },
        body: JSON.stringify({
          input: hermesInput,
          instructions: "Run the Mosaic project-manager skill and return only its user-safe structured JSON. Never reveal hidden reasoning or invent owners and deadlines.",
          session_id: runId,
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`Hermes returned HTTP ${response.status}`);
      const result = await response.json();
      return NextResponse.json({ ...result, mode: "hermes" }, { status: 202 });
    } catch (error) {
      console.error(JSON.stringify({
        event: "hermes_run_start_failed",
        runId,
        message: error instanceof Error ? error.message : "Unknown error",
      }));
      return NextResponse.json(await startLuciRun(input, null), { status: 202 });
    }
  } catch (error) {
    if (error instanceof RunContractError) {
      return NextResponse.json(
        { error: "INVALID_RUN_REQUEST", message: error.message },
        { status: 400 },
      );
    }

    console.error(JSON.stringify({
      event: "run_request_failed",
      message: error instanceof Error ? error.message : "Unknown error",
    }));
    return NextResponse.json(
      {
        error: "RUN_START_FAILED",
        message: "Mosaic could not start this run. Please retry.",
      },
      { status: 500 },
    );
  }
}
