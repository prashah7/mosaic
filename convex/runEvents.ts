import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const append = mutationGeneric({
  args: {
    eventId: v.string(),
    runId: v.string(),
    sequence: v.number(),
    eventType: v.string(),
    level: v.union(v.literal("INFO"), v.literal("WARNING"), v.literal("ERROR")),
    message: v.string(),
    agentTaskId: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("runEvents")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .unique();
    if (existing) return existing._id;
    return ctx.db.insert("runEvents", args);
  },
});

export const list = queryGeneric({
  args: { runId: v.string(), after: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("runEvents")
      .withIndex("by_run_sequence", (q) => q.eq("runId", args.runId))
      .order("asc")
      .collect();
    return events.filter((event) => event.sequence > (args.after ?? 0));
  },
});
