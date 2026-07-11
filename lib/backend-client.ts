import type {
  Artifact,
  EvidenceSource,
  Initiative,
  KanbanAction,
  MemoryRecord,
  Run,
  SynthesisBlock,
} from "@/lib/types";
import { useEffect, useState } from "react";

type ApiEnvelope<T> = { data: T; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body.data;
}

type ApiInitiative = {
  id: string; name: string; objective: string; description: string;
  successMetrics: string[]; targetDate: string; stage: string;
  health: "ON_TRACK" | "AT_RISK" | "BLOCKED"; stakeholders: string[];
};

type ApiRun = {
  id: string; initiativeId: string; type: Run["type"];
  intent: string; status: "COMPLETED" | "FAILED";
  retrievedSourceIds: string[]; summary: Record<string, unknown>; createdAt: string;
};

type ApiAction = {
  id: string; initiativeId: string; runId: string; title: string;
  description: string; owner?: string; deadline?: string;
  status: "PROPOSED" | "APPROVED" | "IN_PROGRESS" | "WAITING" | "BLOCKED" | "DONE" | "VERIFIED";
  sourceIds: string[];
};

type ApiMemory = {
  id: string; initiativeId: string; type: MemoryRecord["type"] | "QUESTION";
  statement: string; status: "CONFIRMED" | "PROPOSED" | "DISPUTED" | "SUPERSEDED";
  confidence: number; sourceIds: string[]; sourceRunId?: string; createdAt: string;
};

type ApiSource = {
  id: string; initiativeId: string; name: string; type: string;
  excerpt: string; createdAt: string;
};

type ApiArtifact = {
  id: string; initiativeId: string; runId: string; type: Artifact["type"];
  title: string; content: string; createdAt: string;
};

const healthMap = { ON_TRACK: "On track", AT_RISK: "At risk", BLOCKED: "Blocked" } as const;

export const mapInitiative = (item: ApiInitiative): Initiative => ({
  ...item,
  deadline: item.targetDate || undefined,
  stage: item.stage as Initiative["stage"],
  health: healthMap[item.health],
  summary: item.description || item.objective,
});

function summaryBlocks(summary: Record<string, unknown>): SynthesisBlock[] {
  const blocks: SynthesisBlock[] = [];
  for (const [key, value] of Object.entries(summary)) {
    if (key === "transcriptProvided" || value == null) continue;
    const body = Array.isArray(value)
      ? value.map((entry) => typeof entry === "string" ? entry : JSON.stringify(entry)).join("\n")
      : typeof value === "string" ? value : JSON.stringify(value);
    const lower = key.toLowerCase();
    const kind: SynthesisBlock["kind"] = lower.includes("risk") || lower.includes("block")
      ? "risk" : lower.includes("decision") ? "decision" : lower.includes("question")
        ? "question" : lower.includes("commit") ? "commitment" : lower.includes("depend")
          ? "dependency" : lower.includes("agenda") ? "agenda" : lower.includes("chang")
            ? "changed" : "summary";
    blocks.push({ id: key, kind, title: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), body, citations: [] });
  }
  return blocks;
}

export const mapRun = (run: ApiRun): Run => ({
  id: run.id, initiativeId: run.initiativeId, type: run.type, status: run.status,
  instruction: run.intent, createdAt: run.createdAt, completedAt: run.createdAt,
  triggeredBy: "Mosaic backend", evidenceSourceIds: run.retrievedSourceIds,
  retrievedMemoryIds: [], synthesis: summaryBlocks(run.summary),
  opinion: Object.values(run.summary).find((value) => typeof value === "string") as string | undefined,
});

export const mapAction = (action: ApiAction): KanbanAction => ({
  id: action.id, initiativeId: action.initiativeId, runId: action.runId,
  title: action.title, description: action.description,
  column: action.status === "DONE" || action.status === "VERIFIED" ? "DONE"
    : action.status === "IN_PROGRESS" || action.status === "WAITING" || action.status === "BLOCKED" ? "DOING" : "TODO",
  ownerName: action.owner, deadline: action.deadline,
  approvalStatus: action.status === "PROPOSED" ? "PROPOSED" : "APPROVED",
  citations: action.sourceIds.map((sourceId) => ({ sourceId, sourceTitle: "Evidence", excerpt: "" })),
});

export const mapMemory = (record: ApiMemory): MemoryRecord => ({
  id: record.id, initiativeId: record.initiativeId,
  type: record.type === "QUESTION" ? "OPEN_QUESTION" : record.type,
  statement: record.statement, sourceEvidenceIds: record.sourceIds,
  sourceRunId: record.sourceRunId ?? "", confidence: record.confidence,
  status: record.status.toLowerCase() as MemoryRecord["status"],
  firstSeenAt: record.createdAt, lastConfirmedAt: record.createdAt,
  proposed: record.status === "PROPOSED",
});

export const api = {
  initiatives: async () => (await request<ApiInitiative[]>("/api/initiatives")).map(mapInitiative),
  initiative: async (id: string) => mapInitiative((await request<{ initiative: ApiInitiative }>(`/api/initiatives/${id}`)).initiative),
  runs: async (id: string) => (await request<ApiRun[]>(`/api/initiatives/${id}/runs`)).map(mapRun),
  run: async (initiativeId: string, runId: string) => {
    const data = await request<{ run: ApiRun; artifacts: ApiArtifact[]; actions: ApiAction[]; memoryProposals: ApiMemory[] }>(`/api/initiatives/${initiativeId}/runs/${runId}`);
    return { run: mapRun(data.run), artifacts: data.artifacts, actions: data.actions.map(mapAction), memory: data.memoryProposals.map(mapMemory) };
  },
  createRun: (initiativeId: string, input: { type: Run["type"]; intent: string; sourceIds: string[] }) => request<{ run: ApiRun }>(`/api/initiatives/${initiativeId}/runs`, { method: "POST", body: JSON.stringify(input) }),
  actions: async (id: string) => (await request<ApiAction[]>(`/api/initiatives/${id}/actions`)).map(mapAction),
  patchAction: (initiativeId: string, actionId: string, patch: Partial<Pick<ApiAction, "status" | "owner" | "deadline">>) => request<ApiAction>(`/api/initiatives/${initiativeId}/actions?actionId=${encodeURIComponent(actionId)}`, { method: "PATCH", body: JSON.stringify(patch) }),
  memory: async (id: string) => (await request<ApiMemory[]>(`/api/initiatives/${id}/memory`)).map(mapMemory),
  patchMemory: (initiativeId: string, memoryId: string, patch: Partial<Pick<ApiMemory, "status" | "confidence">>) => request<ApiMemory>(`/api/initiatives/${initiativeId}/memory?memoryId=${encodeURIComponent(memoryId)}`, { method: "PATCH", body: JSON.stringify(patch) }),
  sources: async (id: string): Promise<EvidenceSource[]> => (await request<ApiSource[]>(`/api/initiatives/${id}/sources`)).map((source) => ({ id: source.id, initiativeId: source.initiativeId, type: "OTHER", title: source.name, content: source.excerpt, wordCount: source.excerpt.split(/\s+/).length, createdAt: source.createdAt, updatedAt: source.createdAt })),
  artifacts: (id: string) => request<ApiArtifact[]>(`/api/initiatives/${id}/artifacts`),
};

export function useBackendInitiative(id: string) {
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    api.initiative(id).then(
      (value) => { if (active) setInitiative(value); },
      (cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load initiative"); },
    );
    return () => { active = false; };
  }, [id]);
  return { initiative, error };
}
