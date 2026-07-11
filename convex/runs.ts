import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const runArgs = {
  mosaicRunId: v.string(),
  initiativeId: v.string(),
  type: v.string(),
  intent: v.string(),
  status: v.string(),
  sourceIds: v.array(v.string()),
  idempotencyKey: v.string(),
  hermesRunId: v.optional(v.string()),
  traceId: v.optional(v.string()),
  specialistRuns: v.optional(v.array(v.object({
    role: v.string(),
    runId: v.string(),
    status: v.string(),
  }))),
  coordinatorRunId: v.optional(v.string()),
  summary: v.any(),
  output: v.optional(v.any()),
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
  completedAt: v.optional(v.string()),
};

export const upsert = mutationGeneric({
  args: runArgs,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("runs")
      .withIndex("by_mosaic_run", (q) => q.eq("mosaicRunId", args.mosaicRunId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    const idempotent = await ctx.db
      .query("runs")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .unique();
    if (idempotent) return idempotent._id;
    return ctx.db.insert("runs", args);
  },
});

export const get = queryGeneric({
  args: { mosaicRunId: v.string() },
  handler: (ctx, args) => ctx.db
    .query("runs")
    .withIndex("by_mosaic_run", (q) => q.eq("mosaicRunId", args.mosaicRunId))
    .unique(),
});

export const findByIdempotency = queryGeneric({
  args: { idempotencyKey: v.string() },
  handler: (ctx, args) => ctx.db
    .query("runs")
    .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
    .unique(),
});

export const listForInitiative = queryGeneric({
  args: { initiativeId: v.string() },
  handler: (ctx, args) => ctx.db
    .query("runs")
    .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
    .order("desc")
    .collect(),
});
