import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  runs: defineTable({
    mosaicRunId: v.string(),
    initiativeId: v.string(),
    type: v.string(),
    intent: v.string(),
    status: v.string(),
    sourceIds: v.array(v.string()),
    idempotencyKey: v.string(),
    hermesRunId: v.optional(v.string()),
    traceId: v.optional(v.string()),
    summary: v.any(),
    output: v.optional(v.any()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_mosaic_run", ["mosaicRunId"])
    .index("by_initiative", ["initiativeId"])
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_hermes_run", ["hermesRunId"]),
  runEvents: defineTable({
    eventId: v.string(),
    runId: v.string(),
    sequence: v.number(),
    eventType: v.string(),
    level: v.union(v.literal("INFO"), v.literal("WARNING"), v.literal("ERROR")),
    message: v.string(),
    agentTaskId: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_event", ["eventId"])
    .index("by_run_sequence", ["runId", "sequence"]),
});
