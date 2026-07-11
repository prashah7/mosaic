"use client";

import { use, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PageHeader } from "@/components/ui/panel";
import { getEvidenceForInitiative, getInitiative } from "@/lib/mosaic-data";
import type { RunType } from "@/lib/types";
import { cn } from "@/lib/utils";

const runTypes: Array<{ id: RunType; label: string; hint: string }> = [
  {
    id: "PRE_MEETING",
    label: "Pre-meeting",
    hint: "Brief + agenda before a sync",
  },
  {
    id: "POST_MEETING",
    label: "Post-meeting",
    hint: "Synthesis, memory, follow-ups",
  },
  {
    id: "WEEKLY_REVIEW",
    label: "Weekly review",
    hint: "Progress vs goal",
  },
  {
    id: "GENERAL_SYNTHESIS",
    label: "General",
    hint: "Open-ended synthesis",
  },
];

const defaultIntent: Record<RunType, string> = {
  PRE_MEETING:
    "Prepare me for the July 8 architecture planning meeting with eng, infra, legal, and CS.",
  POST_MEETING:
    "Synthesize the July 8 architecture meeting and update initiative memory and follow-ups.",
  WEEKLY_REVIEW:
    "Weekly review: what moved on Enterprise SSO, what is blocked, and what needs a decision.",
  GENERAL_SYNTHESIS:
    "Synthesize current evidence into an initiative status update with citations.",
};

const seedEvidenceByType: Record<RunType, string[]> = {
  PRE_MEETING: ["src_rr", "src_prd", "src_prior", "src_tickets"],
  POST_MEETING: ["src_transcript", "src_prd", "src_tickets", "src_slack"],
  WEEKLY_REVIEW: ["src_prd", "src_tickets", "src_slack", "src_transcript"],
  GENERAL_SYNTHESIS: ["src_prd", "src_transcript", "src_prior"],
};

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default function AskLuciPage({ params }: PageProps) {
  const { initiativeId } = use(params);
  const initiative = getInitiative(initiativeId);
  const evidence = getEvidenceForInitiative(initiativeId);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{ runId: string; convexStatus: string; summary: string } | null>(null);
  const [error, setError] = useState("");

  const [runType, setRunType] = useState<RunType>("PRE_MEETING");
  const [intent, setIntent] = useState(defaultIntent.PRE_MEETING);
  const [selected, setSelected] = useState<string[]>(
    seedEvidenceByType.PRE_MEETING,
  );

  const handleTypeChange = (next: RunType) => {
    setRunType(next);
    setIntent(defaultIntent[next]);
    setSelected(seedEvidenceByType[next]);
  };

  const toggleEvidence = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleStart = async () => {
    setIsPending(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/initiatives/init_checkout-reliability/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: runType, intent, sourceIds: selected }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not start run");
      setResult({
        runId: body.data.run.id,
        convexStatus: body.data.convexJob.status,
        summary: body.data.run.summary.executiveSummary ?? body.data.run.summary.objective ?? body.data.run.summary.progress ?? "Run completed.",
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start run");
    } finally {
      setIsPending(false);
    }
  };

  if (!initiative) {
    return <p className="text-sm text-muted">Initiative not found.</p>;
  }

  return (
    <div className="stagger mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Ask Luci"
        description={`Prepare for eng sync, capture what changed, or synthesize ${initiative.name}.`}
      />

      <Panel className="space-y-5 p-4 sm:p-5">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-dim">
            Run type
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {runTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeChange(type.id)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left transition focus-ring",
                  runType === type.id
                    ? "border-accent/40 bg-accent-soft"
                    : "border-border bg-surface-raised hover:bg-white/[0.03]",
                )}
              >
                <p className="text-[13px] font-medium text-foreground">
                  {type.label}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{type.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="intent"
            className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-dim"
          >
            Intent
          </label>
          <textarea
            id="intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-md border border-border bg-surface-raised px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent/50"
          />
        </div>

        <div>
          <PanelHeader
            title="Evidence"
            description="Select sources Luci should use"
          />
          <ul className="mt-2 space-y-1.5">
            {evidence.map((src) => {
              const isOn = selected.includes(src.id);
              return (
                <li key={src.id}>
                  <button
                    type="button"
                    onClick={() => toggleEvidence(src.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition focus-ring",
                      isOn
                        ? "border-accent/35 bg-accent-soft/60"
                        : "border-border bg-surface-raised hover:bg-white/[0.03]",
                    )}
                  >
                    <div>
                      <p className="text-[13px] text-foreground">{src.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {src.type.replaceAll("_", " ")}
                      </p>
                    </div>
                    {isOn ? <Badge tone="purple">Selected</Badge> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-[12px] text-muted">
            Demo opens the seeded {runType.replaceAll("_", " ").toLowerCase()}{" "}
            result.
          </p>
          <Button
            variant="primary"
            leftIcon={<Sparkles className="size-3.5" />}
            onClick={handleStart}
            disabled={isPending || selected.length === 0 || !intent.trim()}
          >
            {isPending ? "Starting…" : "Start run"}
          </Button>
        </div>
        {error ? <p className="rounded-md border border-red/30 bg-red-soft/20 px-3 py-2 text-xs text-red">{error}</p> : null}
        {result ? (
          <div className="rounded-md border border-lime/30 bg-lime-soft/20 px-3 py-3 text-sm text-foreground">
            <p className="font-medium text-lime">Run created: {result.runId}</p>
            <p className="mt-1 text-xs text-muted">Convex job: {result.convexStatus}</p>
            <p className="mt-2 text-xs text-foreground/80">{result.summary}</p>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
