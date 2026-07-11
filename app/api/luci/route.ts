import { NextRequest, NextResponse } from "next/server";

import {
  parseStartRunRequest,
  RunContractError,
} from "@/contracts/runs";
import { startLuciRun } from "@/server/runs/orchestrator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const input = parseStartRunRequest(body);
    const result = await startLuciRun(input);
    return NextResponse.json(result, { status: 202 });
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
