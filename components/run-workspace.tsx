"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useReviewStore } from "@/components/review-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import {
  healthTone,
  memoryStatusTone,
  runStatusTone,
  taskStatusClass,
} from "@/components/ui/status";
import {
  getArtifactsForRun,
  getEvidenceById,
  getMemoryForInitiative,
} from "@/lib/mosaic-data";
import type {
  AgentTask,
  Initiative,
  Run,
  RunEvent,
  SynthesisBlock,
} from "@/lib/types";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const agentLabel: Record<string, string> = {
  LUCI: "Luci",
  CONTEXT_RETRIEVER: "Context",
  SYNTHESIZER: "Synthesizer",
  ARTIFACT_GENERATOR: "Artifacts",
  ACTION_MANAGER: "Actions",
  MEMORY_CURATOR: "Memory",
};

const kindOrder: Record<SynthesisBlock["kind"], number> = {
  summary: 0,
  changed: 1,
  decision: 2,
  commitment: 3,
  risk: 4,
  dependency: 5,
  question: 6,
  agenda: 7,
};

export const RunWorkspace = ({
  initiative,
  run,
  tasks,
  events,
}: {
  initiative: Initiative;
  run: Run;
  tasks: AgentTask[];
  events: RunEvent[];
}) => {
  const {
    memory,
    actions,
    approveMemory,
    rejectMemory,
    approveAction,
    rejectAction,
    setActionOwner,
    approveAllProposed,
  } = useReviewStore();

  const [showTimeline, setShowTimeline] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const artifacts = getArtifactsForRun(run.id);
  const mindMap = artifacts.find((a) => a.type === "MIND_MAP");

  const runMemory = memory.filter((m) => m.sourceRunId === run.id);
  const runActions = actions.filter((a) => a.runId === run.id);
  const proposedMemory = runMemory.filter((m) => m.proposed);
  const proposedActions = runActions.filter(
    (a) => a.approvalStatus === "PROPOSED",
  );
  const pendingCount = proposedMemory.length + proposedActions.length;

  const retrievedMemory = useMemo(() => {
    const all = getMemoryForInitiative(initiative.id);
    return all.filter((m) => run.retrievedMemoryIds.includes(m.id));
  }, [initiative.id, run.retrievedMemoryIds]);

  const sortedBlocks = useMemo(() => {
    return [...run.synthesis].sort(
      (a, b) => kindOrder[a.kind] - kindOrder[b.kind],
    );
  }, [run.synthesis]);

  const handleApproveAll = () => {
    approveAllProposed();
    setReviewDone(true);
  };

  return (
    <div className="stagger mx-auto max-w-3xl space-y-5 pb-28">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={runStatusTone(run.status)}>
              {run.status === "COMPLETED" ? "Completed" : run.status}
            </Badge>
            <Badge tone="purple">{run.type.replaceAll("_", " ")}</Badge>
            <Badge tone={healthTone(initiative.health)}>
              {initiative.health}
            </Badge>
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-foreground sm:text-[28px]">
            {run.type === "PRE_MEETING"
              ? "Pre-meeting brief"
              : run.type === "POST_MEETING"
                ? "Post-meeting synthesis"
                : "Luci result"}
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
            {initiative.name} · {run.instruction}
          </p>
        </div>
        <div className="text-right text-[11px] text-muted">
          <p className="font-mono text-[13px] text-foreground">
            {formatDuration(run.durationMs)}
          </p>
          <p>
            {run.completedAt
              ? formatRelativeTime(run.completedAt)
              : "running"}{" "}
            · {run.triggeredBy}
          </p>
        </div>
      </div>

      {run.opinion ? (
        <Panel className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-dim">
            Luci’s take
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-foreground">
            {run.opinion}
          </p>
        </Panel>
      ) : null}

      {retrievedMemory.length > 0 ? (
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Retrieved memory"
            description="Prior M3 facts used in this run"
          />
          <ul>
            {retrievedMemory.map((mem) => (
              <li
                key={mem.id}
                className="border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={memoryStatusTone(mem.status)}>{mem.status}</Badge>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-muted-dim">
                    {mem.type}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-foreground">
                  {mem.statement}
                </p>
                <p className="mt-1 text-[11px] text-accent">
                  Provenance:{" "}
                  {mem.sourceEvidenceIds
                    .map((id) => getEvidenceById(id)?.title)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="space-y-3">
        {sortedBlocks.map((block) => (
          <SynthesisCard key={block.id} block={block} />
        ))}
      </div>

      {mindMap ? (
        <Panel className="overflow-hidden">
          <PanelHeader
            title={mindMap.title}
            description="Mermaid mind-map artifact"
          />
          <pre className="overflow-x-auto bg-black/30 p-4 font-mono text-[11px] leading-relaxed text-[#c5caf5] scrollbar-thin">
            {mindMap.content}
          </pre>
        </Panel>
      ) : null}

      <Panel className="overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left focus-ring"
          onClick={() => setShowTimeline((v) => !v)}
        >
          <div>
            <p className="text-[13px] font-medium text-foreground">
              Run timeline
            </p>
            <p className="text-[11px] text-muted">
              Compact specialist path — demoted observability
            </p>
          </div>
          {showTimeline ? (
            <ChevronUp className="size-4 text-muted" />
          ) : (
            <ChevronDown className="size-4 text-muted" />
          )}
        </button>
        {showTimeline ? (
          <div className="space-y-3 border-t border-border p-4">
            {tasks.length > 0 ? (
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-raised px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-foreground">
                        {agentLabel[task.agentType] ?? task.agentType}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {task.outputSummary ?? task.task}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px]",
                        taskStatusClass(task.status),
                      )}
                    >
                      {task.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="space-y-1.5">
              {events.map((event) => (
                <li key={event.id} className="text-[11px] leading-relaxed">
                  <span
                    className={
                      event.level === "WARNING"
                        ? "text-amber"
                        : event.level === "ERROR"
                          ? "text-red"
                          : "text-muted"
                    }
                  >
                    [{event.eventType}]
                  </span>{" "}
                  <span className="text-foreground/90">{event.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Panel>

      {(runMemory.length > 0 || runActions.length > 0) && (
        <div className="space-y-4">
          {runMemory.length > 0 ? (
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Memory proposals"
                description="Confirm what Luci should remember"
              />
              <ul>
                {runMemory.map((mem) => (
                  <li
                    key={mem.id}
                    className="border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={memoryStatusTone(mem.status)}>
                        {mem.status}
                      </Badge>
                      <span className="text-[10px] uppercase tracking-[0.1em] text-muted-dim">
                        {mem.type}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-foreground">
                      {mem.statement}
                    </p>
                    {mem.proposed ? (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => approveMemory(mem.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMemory(mem.id)}
                        >
                          Dispute
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-green">
                        <Check className="size-3" /> Recorded
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {runActions.length > 0 ? (
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Proposed Kanban actions"
                description="Approve follow-ups — missing owners stay null"
                action={
                  <Link
                    href={`/initiatives/${initiative.id}/board`}
                    className="text-xs text-accent hover:underline"
                  >
                    Open board
                  </Link>
                }
              />
              <ul>
                {runActions.map((action) => (
                  <li
                    key={action.id}
                    className="border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          action.approvalStatus === "APPROVED"
                            ? "green"
                            : action.approvalStatus === "REJECTED"
                              ? "red"
                              : "blue"
                        }
                      >
                        {action.approvalStatus}
                      </Badge>
                      {!action.ownerName ? (
                        <Badge
                          tone="amber"
                          icon={<AlertTriangle className="size-2.5" />}
                        >
                          Human assignment required
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[13px] font-medium text-foreground">
                      {action.title}
                    </p>
                    <p className="mt-1 text-[12px] text-muted">
                      {action.description}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-dim">
                      Owner: {action.ownerName ?? "—"}
                    </p>
                    {action.approvalStatus === "PROPOSED" ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => approveAction(action.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectAction(action.id)}
                        >
                          Reject
                        </Button>
                        {!action.ownerName ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setActionOwner(action.id, "Sambit Nayak")
                            }
                          >
                            Assign me
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      )}

      {pendingCount > 0 || reviewDone ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[#0f0f10]/95 backdrop-blur-md lg:pl-[232px]">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                {reviewDone
                  ? "Review saved"
                  : `Review · ${pendingCount} proposal${pendingCount === 1 ? "" : "s"}`}
              </p>
              <p className="text-[11px] text-muted">
                One moment: approve memory updates and Kanban actions together.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/initiatives/${initiative.id}/board`}>
                <Button variant="outline" size="sm">
                  Board
                </Button>
              </Link>
              {!reviewDone ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApproveAll}
                  leftIcon={<Check className="size-3.5" />}
                >
                  Approve all
                </Button>
              ) : (
                <Link href={`/initiatives/${initiative.id}/memory`}>
                  <Button variant="primary" size="sm">
                    View memory
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SynthesisCard = ({ block }: { block: SynthesisBlock }) => (
  <Panel className="p-4">
    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-dim">
      {block.title}
    </p>
    <p className="mt-2 text-[14px] leading-relaxed text-foreground">
      {block.body}
    </p>
    {block.citations.length > 0 ? (
      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
        {block.citations.map((cite, i) => (
          <li key={`${cite.sourceId}-${i}`} className="text-[11px] text-accent">
            ← {cite.sourceTitle}: “{cite.excerpt}”
          </li>
        ))}
      </ul>
    ) : null}
  </Panel>
);
