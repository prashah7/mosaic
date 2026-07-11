import { z } from "zod";
import { error, json } from "@/src/lib/http";
import {
  getRuntimeConfigStatus,
  updateRuntimeConfig,
} from "@/src/lib/runtime-config";

export const dynamic = "force-dynamic";

const httpUrl = z
  .string()
  .trim()
  .max(2_048)
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must use HTTP or HTTPS");

const secret = z.string().trim().min(1).max(8_192);

const runtimeConfigInput = z
  .object({
    hermesBaseUrl: httpUrl.optional(),
    hermesApiKey: secret.optional(),
    openAiApiKey: secret.optional(),
    convexUrl: httpUrl.optional(),
    convexAuthToken: secret.optional(),
    demoFallback: z.boolean().optional(),
  })
  .strict();

export function GET() {
  return json({ data: getRuntimeConfigStatus() });
}

export async function POST(request: Request) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_RUNTIME_SETTINGS !== "true"
  ) {
    return error("Runtime settings are disabled in production", 403);
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return error("Cross-site configuration requests are not allowed", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return error("Content-Type must be application/json", 415);
  }

  const body = await request.json().catch(() => null);
  const result = runtimeConfigInput.safeParse(body);
  if (!result.success) {
    return error(result.error.issues[0]?.message ?? "Invalid runtime configuration");
  }

  return json({ data: updateRuntimeConfig(result.data) });
}
