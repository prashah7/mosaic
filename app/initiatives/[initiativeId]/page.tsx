import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Columns3,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PageHeader } from "@/components/ui/panel";
import {
  columnLabel,
  healthTone,
  memoryStatusTone,
  runStatusTone,
} from "@/components/ui/status";
import {
  getActionsForInitiative,
  getEvidenceForInitiative,
  getInitiative,
  getMemoryForInitiative,
  getRun,
  getRunsForInitiative,
  pmProfile,
} from "@/lib/mosaic-data";
import { formatRelativeTime } from "@/lib/utils";

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default async function InitiativeHomePage({ params }: PageProps) {
  const { initiativeId } = await params;
  const initiative = getInitiative(initiativeId);
  if (!initiative) notFound();

  const runs = getRunsForInitiative(initiativeId).sort((a, b) =>
    (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt),
  );
  const latestRun = initiative.latestRunId
    ? getRun(initiative.latestRunId)
    : runs[0];
  const memory = getMemoryForInitiative(initiativeId);
  const actions = getActionsForInitiative(initiativeId);
  const evidence = getEvidenceForInitiative(initiativeId);
  const blockers = actions.filter(
    (a) => !a.ownerName || a.approvalStatus === "PROPOSED",
  );
  const recentMemory = [...memory]
    .sort((a, b) => b.lastConfirmedAt.localeCompare(a.lastConfirmedAt))
    .slice(0, 4);

  return (
    <div className="stagger mx-auto max-w-5xl space-y-5">
      <PageHeader
        title={initiative.name}
        description={initiative.objective}
        action={
          <Link href={`/initiatives/${initiativeId}/ask`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="size-3.5" />}
            >
              Ask Luci
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={healthTone(initiative.health)}>{initiative.health}</Badge>
        <Badge tone="neutral">{initiative.stage}</Badge>
        {initiative.deadline ? (
          <Badge tone="amber">Due {initiative.deadline}</Badge>
        ) : null}
        <Badge tone="blue">{pmProfile.title}</Badge>
      </div>

      <Panel className="p-4 sm:p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-dim">
          Current summary
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {initiative.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {initiative.successMetrics.map((metric) => (
            <span
              key={metric}
              className="rounded-md border border-border bg-surface-raised px-2.5 py-1 text-[11px] text-muted"
            >
              {metric}
            </span>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Latest Luci output"
            description={
              latestRun
                ? `${latestRun.type.replaceAll("_", " ")} · ${formatRelativeTime(latestRun.completedAt ?? latestRun.createdAt)}`
                : "No runs yet"
            }
            action={
              latestRun ? (
                <Badge tone={runStatusTone(latestRun.status)}>
                  {latestRun.status === "COMPLETED" ? "Ready" : latestRun.status}
                </Badge>
              ) : null
            }
          />
          {latestRun ? (
            <div className="space-y-3 p-4">
              <p className="text-[13px] leading-relaxed text-foreground">
                {latestRun.opinion}
              </p>
              <ul className="space-y-2">
                {latestRun.synthesis.slice(0, 3).map((block) => (
                  <li
                    key={block.id}
                    className="rounded-md border border-border bg-surface-raised px-3 py-2"
                  >
                    <p className="text-[11px] uppercase tracking-[0.1em] text-muted-dim">
                      {block.title}
                    </p>
                    <p className="mt-1 text-[12px] text-foreground/90">
                      {block.body}
                    </p>
                    {block.citations[0] ? (
                      <p className="mt-1.5 text-[11px] text-accent">
                        ← {block.citations[0].sourceTitle}: “
                        {block.citations[0].excerpt}”
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Link
                href={`/initiatives/${initiativeId}/runs/${latestRun.id}`}
                className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline focus-ring rounded"
              >
                Open full result
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted">Ask Luci to start.</p>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Active actions & blockers"
            description={`${blockers.length} need attention`}
            action={
              <Link
                href={`/initiatives/${initiativeId}/board`}
                className="text-xs text-accent hover:underline focus-ring rounded"
              >
                Board
              </Link>
            }
          />
          <ul>
            {actions.slice(0, 5).map((action) => (
              <li
                key={action.id}
                className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {columnLabel(action.column)}
                    {action.ownerName
                      ? ` · ${action.ownerName}`
                      : " · Human assignment required"}
                  </p>
                </div>
                {!action.ownerName ? (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber" />
                ) : (
                  <Badge
                    tone={
                      action.approvalStatus === "APPROVED" ? "green" : "blue"
                    }
                  >
                    {action.approvalStatus === "PROPOSED"
                      ? "Proposed"
                      : action.approvalStatus === "APPROVED"
                        ? "Approved"
                        : "Rejected"}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Recent memory"
            description="Durable facts with provenance"
            action={
              <Link
                href={`/initiatives/${initiativeId}/memory`}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline focus-ring rounded"
              >
                <Brain className="size-3" />
                Memory
              </Link>
            }
          />
          <ul>
            {recentMemory.map((mem) => (
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
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Evidence on hand"
            description={`${evidence.length} sources`}
            action={
              <Link
                href={`/initiatives/${initiativeId}/ask`}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline focus-ring rounded"
              >
                <Columns3 className="size-3" />
                Use in Ask Luci
              </Link>
            }
          />
          <ul>
            {evidence.map((src) => (
              <li
                key={src.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-[13px] text-foreground">{src.title}</p>
                  <p className="text-[11px] text-muted">
                    {src.type.replaceAll("_", " ")} · {src.wordCount} words
                  </p>
                </div>
                <span className="text-[11px] text-muted-dim">
                  {formatRelativeTime(src.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader title="Run history" description="Secondary — open any prior result" />
        <ul>
          {runs.map((run) => (
            <li key={run.id} className="border-b border-border last:border-b-0">
              <Link
                href={`/initiatives/${initiativeId}/runs/${run.id}`}
                className="linear-row flex items-center justify-between gap-3 px-4 py-3 focus-ring"
              >
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {run.type.replaceAll("_", " ")}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">
                    {run.instruction}
                  </p>
                </div>
                <Badge tone={runStatusTone(run.status)}>
                  {run.status === "COMPLETED" ? "Done" : run.status}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
