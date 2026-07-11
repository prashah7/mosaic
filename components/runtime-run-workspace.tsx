"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleStop, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status";
import type { RunEvent, RunStatus } from "@/contracts/runs";

type RuntimeRun = {
  id: string;
  initiativeId: string;
  type?: string;
  status: RunStatus;
  intent?: string;
  instruction?: string;
  summary?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
};

type RuntimeArtifact = {
  id: string;
  type: string;
  title: string;
  content: unknown;
};

type RuntimeAction = {
  id?: string;
  title?: string;
  description?: string;
  owner?: string | null;
  ownerName?: string | null;
  deadline?: string | null;
  status?: string;
  approvalStatus?: string;
  priority?: string;
  human_assignment_required?: boolean;
  human_deadline_required?: boolean;
};

type RuntimeMemoryProposal = {
  id?: string;
  operation?: string;
  type?: string;
  statement?: string;
  status?: string;
  confidence?: number;
};

type RunSnapshot = {
  run: RuntimeRun;
  events: RunEvent[];
  artifacts: RuntimeArtifact[];
  actions: RuntimeAction[];
  memoryProposals: RuntimeMemoryProposal[];
};

type RunResponse = {
  data?: Partial<RunSnapshot> & { run?: RuntimeRun };
  error?: string;
};

const terminalStatuses = new Set<RunStatus>([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

const sectionKeys: Array<[string, string]> = [
  ["what_changed", "What changed"],
  ["changedSinceLastMeeting", "Changed since last meeting"],
  ["completed", "Completed"],
  ["decisions", "Decisions"],
  ["decisionsToMake", "Decisions to make"],
  ["commitments", "Commitments"],
  ["risks", "Risks"],
  ["blockers", "Blockers"],
  ["dependencies", "Dependencies"],
  ["priorities", "Priorities"],
  ["open_questions", "Open questions"],
  ["questions", "Questions"],
  ["suggestedAgenda", "Suggested agenda"],
  ["goalImplications", "Goal implications"],
];

export const RuntimeRunWorkspace = ({
  initiativeId,
  initiativeName,
  runId,
}: {
  initiativeId: string;
  initiativeName: string;
  runId: string;
}) => {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const endpoint = `/api/initiatives/${initiativeId}/runs/${runId}`;

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    let controller: AbortController | undefined;

    const poll = async () => {
      controller = new AbortController();
      let shouldContinue = true;

      try {
        const response = await fetch(endpoint, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json().catch(() => null)) as RunResponse | null;

        if (!response.ok || !body?.data?.run) {
          throw new Error(body?.error ?? "Could not load this run");
        }

        const next: RunSnapshot = {
          run: body.data.run,
          events: body.data.events ?? [],
          artifacts: body.data.artifacts ?? [],
          actions: body.data.actions ?? [],
          memoryProposals: body.data.memoryProposals ?? [],
        };

        if (!active) return;
        setSnapshot(next);
        setLoadError(null);
        setIsLoading(false);
        shouldContinue = !terminalStatuses.has(next.run.status);
      } catch (cause) {
        if (!active || (cause instanceof DOMException && cause.name === "AbortError")) {
          return;
        }
        setLoadError(cause instanceof Error ? cause.message : "Could not load this run");
        setIsLoading(false);
      }

      if (active && shouldContinue) {
        timer = window.setTimeout(poll, 1000);
      }
    };

    void poll();

    return () => {
      active = false;
      controller?.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [endpoint, refreshVersion]);

  const sortedEvents = useMemo(
    () => [...(snapshot?.events ?? [])].sort((a, b) => a.sequence - b.sequence),
    [snapshot?.events],
  );

  const cancelRun = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const response = await fetch(`${endpoint}/cancel`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as RunResponse | null;
      if (!response.ok) {
        throw new Error(body?.error ?? "Could not cancel this run");
      }
      setRefreshVersion((version) => version + 1);
    } catch (cause) {
      setCancelError(
        cause instanceof Error ? cause.message : "Could not cancel this run",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading && !snapshot) {
    return (
      <div className="mx-auto max-w-3xl py-8" role="status" aria-live="polite">
        <div className="flex items-center gap-2 text-sm text-muted">
          <StatusDot tone="purple" live />
          Loading live run…
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <Panel className="p-4" raised>
          <div role="alert" className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red" />
            <div>
              <h1 className="text-[15px] font-medium text-foreground">
                Run unavailable
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                {loadError ?? "The runtime did not return this run."}
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                leftIcon={<RotateCcw className="size-3.5" />}
                onClick={() => {
                  setIsLoading(true);
                  setRefreshVersion((version) => version + 1);
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  const { run, artifacts } = snapshot;
  const isTerminal = terminalStatuses.has(run.status);
  const output = asRecord(run.output);
  const summary = asRecord(run.summary);
  const executiveSummary =
    getString(output, "executive_summary") ??
    getString(summary, "executiveSummary") ??
    getString(summary, "objective") ??
    getString(summary, "progress");
  const sections = buildSections(output, summary);
  const outputActions = asArray(output.actions) as RuntimeAction[];
  const actions = snapshot.actions.length > 0 ? snapshot.actions : outputActions;
  const outputMemory = asArray(output.memory_proposals) as RuntimeMemoryProposal[];
  const memoryProposals =
    snapshot.memoryProposals.length > 0
      ? snapshot.memoryProposals
      : outputMemory;
  const mermaid =
    getString(output, "mermaid") ??
    getMermaidArtifact(artifacts);
  const resultArtifacts = artifacts.filter((artifact) => artifact.type !== "MIND_MAP");

  return (
    <main
      className="stagger mx-auto max-w-3xl space-y-5 pb-12"
      aria-busy={!isTerminal}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-[12px] text-muted">
            <Link
              href={`/initiatives/${initiativeId}`}
              className="text-foreground hover:underline"
            >
              {initiativeName}
            </Link>
            <span className="text-muted-dim"> · Live run</span>
          </p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              tone={statusTone(run.status)}
              icon={
                <StatusDot
                  tone={statusDotTone(run.status)}
                  live={!isTerminal && run.status !== "WAITING_FOR_APPROVAL"}
                />
              }
            >
              {formatLabel(run.status)}
            </Badge>
            {run.type ? <Badge tone="purple">{formatLabel(run.type)}</Badge> : null}
          </div>
          <h1 className="text-[24px] font-semibold text-foreground sm:text-[28px]">
            {run.status === "COMPLETED" ? "Luci result" : "Luci is working"}
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-muted">
            {run.intent ?? run.instruction ?? `Run ${run.id}`}
          </p>
        </div>
        {!isTerminal ? (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<CircleStop className="size-3.5" />}
            onClick={cancelRun}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling…" : "Cancel run"}
          </Button>
        ) : null}
      </div>

      {loadError ? (
        <p
          className="rounded-md border border-amber/25 bg-amber-soft px-3 py-2 text-xs text-amber"
          role="status"
        >
          Live updates are temporarily unavailable: {loadError}
        </p>
      ) : null}
      {cancelError ? (
        <p
          className="rounded-md border border-red/25 bg-red-soft px-3 py-2 text-xs text-red"
          role="alert"
        >
          {cancelError}
        </p>
      ) : null}

      <RunState run={run} />

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Run timeline"
          description={
            sortedEvents.length > 0
              ? `${sortedEvents.length} runtime event${sortedEvents.length === 1 ? "" : "s"}`
              : "Waiting for the runtime"
          }
        />
        {sortedEvents.length > 0 ? (
          <ol className="divide-y divide-border" aria-live="polite">
            {sortedEvents.map((event) => (
              <li key={event.id} className="flex gap-3 px-4 py-3">
                <StatusDot tone={eventTone(event.level)} className="mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[11px] font-medium text-muted">
                      {formatLabel(event.eventType)}
                    </p>
                    <time className="text-[10px] text-muted-dim" dateTime={event.createdAt}>
                      {formatTimestamp(event.createdAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-foreground">
                    {event.message}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-4 py-5 text-[13px] text-muted" role="status" aria-live="polite">
            No runtime events have been emitted yet.
          </p>
        )}
      </Panel>

      {run.status === "COMPLETED" ? (
        <>
          <Panel className="p-4">
            <p className="text-[11px] font-medium uppercase text-muted-dim">
              Summary
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-foreground">
              {executiveSummary ?? "The run completed without an executive summary."}
            </p>
          </Panel>

          {sections.map((section) => (
            <ResultSection key={section.title} title={section.title} items={section.items} />
          ))}

          {resultArtifacts.length > 0 ? (
            <Panel className="overflow-hidden">
              <PanelHeader title="Artifacts" />
              <ul className="divide-y divide-border">
                {resultArtifacts.map((artifact) => (
                  <li key={artifact.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground">
                        {artifact.title}
                      </p>
                      <Badge tone="neutral">{formatLabel(artifact.type)}</Badge>
                    </div>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-muted scrollbar-thin">
                      {formatArtifactContent(artifact.content)}
                    </pre>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <ActionList actions={actions} />
          <MemoryList proposals={memoryProposals} />
          <MermaidPanel source={mermaid} />
        </>
      ) : null}
    </main>
  );
};

const RunState = ({ run }: { run: RuntimeRun }) => {
  if (run.status === "WAITING_FOR_APPROVAL") {
    return (
      <Panel className="border-amber/25 bg-amber-soft/20 p-4">
        <div className="flex gap-3" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" />
          <div>
            <p className="text-[13px] font-medium text-foreground">
              Waiting for approval
            </p>
            <p className="mt-1 text-[12px] text-muted">
              The runtime is paused until its pending approval is resolved.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  if (run.status === "FAILED") {
    return (
      <Panel className="border-red/25 bg-red-soft/20 p-4">
        <div className="flex gap-3" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red" />
          <div>
            <p className="text-[13px] font-medium text-foreground">Run failed</p>
            <p className="mt-1 text-[12px] text-muted">
              {run.errorMessage ?? "The runtime could not complete this run."}
            </p>
            {run.errorCode ? (
              <p className="mt-1 font-mono text-[10px] text-muted-dim">{run.errorCode}</p>
            ) : null}
          </div>
        </div>
      </Panel>
    );
  }

  if (run.status === "CANCELLED") {
    return (
      <Panel className="p-4">
        <div className="flex gap-3" role="status">
          <CircleStop className="mt-0.5 size-4 shrink-0 text-muted" />
          <div>
            <p className="text-[13px] font-medium text-foreground">Run cancelled</p>
            <p className="mt-1 text-[12px] text-muted">
              Work stopped before a final result was produced.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  if (run.status === "COMPLETED") {
    return (
      <p className="sr-only" role="status">
        Run completed.
      </p>
    );
  }

  return (
    <p className="sr-only" role="status" aria-live="polite">
      Run status: {formatLabel(run.status)}.
    </p>
  );
};

const ResultSection = ({ title, items }: { title: string; items: unknown[] }) => (
  <Panel className="overflow-hidden">
    <PanelHeader title={title} />
    <ul className="divide-y divide-border">
      {items.map((item, index) => {
        const detail = describeItem(item);
        return (
          <li key={`${title}-${index}`} className="px-4 py-3">
            <p className="text-[13px] leading-relaxed text-foreground">
              {detail.primary}
            </p>
            {detail.meta.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detail.meta.map((value) => (
                  <Badge key={value} tone="neutral">{value}</Badge>
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  </Panel>
);

const ActionList = ({ actions }: { actions: RuntimeAction[] }) => (
  <Panel className="overflow-hidden">
    <PanelHeader title="Proposed actions" description="Follow-ups produced by this run" />
    {actions.length > 0 ? (
      <ul className="divide-y divide-border">
        {actions.map((action, index) => (
          <li key={action.id ?? `${action.title}-${index}`} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">
                {formatLabel(action.status ?? action.approvalStatus ?? "PROPOSED")}
              </Badge>
              {action.priority ? <Badge tone="amber">{action.priority}</Badge> : null}
              {(action.human_assignment_required || (!action.owner && !action.ownerName)) ? (
                <Badge tone="amber">Owner needed</Badge>
              ) : null}
            </div>
            <p className="mt-2 text-[13px] font-medium text-foreground">
              {action.title ?? "Untitled action"}
            </p>
            {action.description ? (
              <p className="mt-1 text-[12px] text-muted">{action.description}</p>
            ) : null}
            <p className="mt-1 text-[11px] text-muted-dim">
              Owner: {action.owner ?? action.ownerName ?? "Unassigned"}
              {action.deadline ? ` · Due ${action.deadline}` : ""}
            </p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="px-4 py-5 text-[13px] text-muted">No actions were proposed.</p>
    )}
  </Panel>
);

const MemoryList = ({ proposals }: { proposals: RuntimeMemoryProposal[] }) => (
  <Panel className="overflow-hidden">
    <PanelHeader title="Memory proposals" description="Potential initiative memory from this run" />
    {proposals.length > 0 ? (
      <ul className="divide-y divide-border">
        {proposals.map((proposal, index) => (
          <li key={proposal.id ?? `${proposal.statement}-${index}`} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">
                {formatLabel(proposal.operation ?? proposal.status ?? "PROPOSED")}
              </Badge>
              {proposal.type ? <Badge tone="neutral">{formatLabel(proposal.type)}</Badge> : null}
              {typeof proposal.confidence === "number" ? (
                <span className="text-[10px] text-muted-dim">
                  {Math.round(proposal.confidence * 100)}% confidence
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground">
              {proposal.statement ?? "Memory proposal"}
            </p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="px-4 py-5 text-[13px] text-muted">No memory changes were proposed.</p>
    )}
  </Panel>
);

const MermaidPanel = ({ source }: { source?: string }) => (
  <Panel className="overflow-hidden">
    <PanelHeader title="Mermaid" description="Generated initiative map" />
    {source ? (
      <pre className="overflow-x-auto bg-black/30 p-4 font-mono text-[11px] leading-relaxed text-[#c5caf5] scrollbar-thin">
        <code>{source}</code>
      </pre>
    ) : (
      <p className="px-4 py-5 text-[13px] text-muted">No Mermaid artifact was generated.</p>
    )}
  </Panel>
);

function buildSections(
  output: Record<string, unknown>,
  summary: Record<string, unknown>,
) {
  const seen = new Set<string>();
  return sectionKeys.flatMap(([key, title]) => {
    const source = key in output ? output : summary;
    const items = asArray(source[key]);
    if (items.length === 0 || seen.has(title)) return [];
    seen.add(title);
    return [{ title, items }];
  });
}

function describeItem(item: unknown) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return { primary: String(item ?? ""), meta: [] as string[] };
  }

  const record = item as Record<string, unknown>;
  const primary =
    getString(record, "statement") ??
    getString(record, "title") ??
    getString(record, "body") ??
    getString(record, "description") ??
    JSON.stringify(record);
  const meta = ["status", "severity", "owner", "deadline", "operation"]
    .map((key) => record[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map(formatLabel);
  return { primary, meta };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null || value === "" ? [] : [value];
}

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getMermaidArtifact(artifacts: RuntimeArtifact[]) {
  const artifact = artifacts.find(
    (item) => item.type === "MIND_MAP" && typeof item.content === "string",
  );
  return typeof artifact?.content === "string" ? artifact.content : undefined;
}

function formatArtifactContent(content: unknown) {
  if (typeof content !== "string") return JSON.stringify(content, null, 2);
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (character) => character.toUpperCase());
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function statusTone(status: RunStatus): "green" | "purple" | "amber" | "red" | "neutral" {
  if (status === "COMPLETED") return "green";
  if (status === "FAILED" || status === "CANCELLED") return "red";
  if (status === "WAITING_FOR_APPROVAL") return "amber";
  if (status === "CREATED") return "neutral";
  return "purple";
}

function statusDotTone(status: RunStatus): "green" | "purple" | "amber" | "red" | "neutral" {
  return statusTone(status);
}

function eventTone(level: RunEvent["level"]): "blue" | "amber" | "red" {
  if (level === "ERROR") return "red";
  if (level === "WARNING") return "amber";
  return "blue";
}
