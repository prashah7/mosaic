import { z } from "zod";
import { error, json } from "@/src/lib/http";
import { createConvexJob } from "@/src/lib/convex";
import { db, getInitiative, id } from "@/src/lib/store";
import type { Artifact, Action, MemoryRecord, Run, RunType } from "@/src/lib/types";

const runSchema = z.object({ type: z.enum(["PRE_MEETING", "POST_MEETING", "WEEKLY_REVIEW", "GENERAL_SYNTHESIS"]), intent: z.string().min(1), transcript: z.string().optional(), sourceIds: z.array(z.string()).optional() });

function buildResult(type: RunType, intent: string, sourceIds: string[], initiativeId: string, runId: string) {
  const isPre = type === "PRE_MEETING";
  const isWeekly = type === "WEEKLY_REVIEW";
  const summary = isPre
    ? { objective: intent, context: "SAML is the v1 direction, while SCIM remains in the PRD and audit logging has no owner.", changedSinceLastMeeting: ["Test Connection is now an explicit enablement requirement."], decisionsToMake: ["Confirm SAML-first scope and assign audit logging ownership."], questions: ["Should SCIM be moved out of the v1 PRD?"], risks: ["Partner launch can slip if audit logging and Test Connection remain ownerless."], suggestedAgenda: ["Confirm SAML-first scope", "Assign audit logging owner", "Align on partner activation update"] }
    : isWeekly
      ? { progress: "SAML-first scope is clear, but the initiative has not yet cleared the audit logging ownership gate.", completed: ["Configuration UI is assigned to Priya."], blockers: ["Audit logging has no owner or ticket."], priorities: ["Create Test Connection ticket", "Assign audit logging owner", "Correct the PRD's SCIM scope"] }
      : { executiveSummary: "The team locked SAML for v1 and deferred SCIM. Test Connection is required, while audit logging remains mandatory without an owner.", whatChanged: ["SCIM was deferred from the July 8 architecture meeting.", "Test Connection became an explicit requirement."], decisions: ["Ship SAML first; defer SCIM. Priya owns configuration UI."], commitments: [{ title: "Provide Acme Design an activation update", owner: "Customer Success", deadline: "Friday" }], risks: ["Audit logging has no owner or ticket."], dependencies: ["Test Connection before SSO enablement."], openQuestions: ["Who owns audit logging implementation?"], goalImplications: "The September 30 partner launch depends on closing the ownership and ticket gaps without disrupting password login." };

  const artifactType = isPre ? "PRE_MEETING_BRIEF" : isWeekly ? "WEEKLY_REVIEW" : "POST_MEETING_SYNTHESIS";
  const artifact: Artifact = { id: id("artifact"), initiativeId, runId, type: artifactType, title: isPre ? "Pre-meeting brief" : isWeekly ? "Weekly review" : "Post-meeting synthesis", content: JSON.stringify(summary, null, 2), sourceIds, version: 1, createdAt: new Date().toISOString() };
  const actions: Action[] = isPre ? [] : [{ id: id("action"), initiativeId, runId, title: "Assign audit logging owner and create ticket", description: "Close the ownerless audit logging requirement before partner go-live.", owner: undefined, status: "PROPOSED", priority: "HIGH", sourceIds: sourceIds.slice(0, 2), createdAt: new Date().toISOString() }];
  const memories: MemoryRecord[] = isPre ? [] : [{ id: id("memory"), initiativeId, type: "RISK", statement: "Audit logging is required for partner go-live but has no owner or ticket.", status: "PROPOSED", confidence: 0.86, sourceIds: sourceIds.slice(0, 2), sourceRunId: runId, createdAt: new Date().toISOString() }];
  const mindMap: Artifact = { id: id("artifact"), initiativeId, runId, type: "MIND_MAP", title: "Initiative workstreams", content: "mindmap\n  root((Enterprise SSO launch))\n    Scope\n      SAML v1\n      SCIM deferred\n    Admin experience\n      Configuration UI\n      Test Connection\n    Launch readiness\n      Audit logging owner\n      Partner activation", sourceIds, version: 1, createdAt: new Date().toISOString() };
  return { summary, artifact, mindMap, actions, memories };
}

export async function GET(_: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  return json({ data: db.runs.filter((run) => run.initiativeId === initiativeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}

export async function POST(request: Request, { params }: { params: Promise<{ initiativeId: string }> }) {
  const { initiativeId } = await params;
  if (!getInitiative(initiativeId)) return error("Initiative not found", 404);
  const parsed = runSchema.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid run");
  const input = parsed.data;
  const runId = id("run");
  const sourceIds = input.sourceIds?.length ? input.sourceIds : db.sources.filter((source) => source.initiativeId === initiativeId).map((source) => source.id);
  const convexJob = await createConvexJob({ runId, initiativeId, type: input.type, intent: input.intent, transcript: input.transcript, sourceIds });
  const result = buildResult(input.type, input.intent, sourceIds, initiativeId, runId);
  db.artifacts.push(result.artifact, result.mindMap);
  db.actions.push(...result.actions);
  db.memory.push(...result.memories);
  const run: Run = { id: runId, initiativeId, type: input.type, intent: input.intent, status: "COMPLETED", retrievedSourceIds: sourceIds, summary: { ...result.summary, transcriptProvided: Boolean(input.transcript) }, artifactIds: [result.artifact.id, result.mindMap.id], actionIds: result.actions.map((action) => action.id), memoryProposalIds: result.memories.map((memory) => memory.id), createdAt: new Date().toISOString() };
  db.runs.push(run);
  return json({ data: { run, convexJob, artifacts: [result.artifact, result.mindMap], actions: result.actions, memoryProposals: result.memories } }, { status: 201 });
}
