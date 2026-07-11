import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { Badge } from "@/components/ui/badge";
import {
  MiniBars,
  RingProgress,
  SegmentBar,
  StatStrip,
} from "@/components/ui/dataviz";
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

  const boardCounts = {
    TODO: actions.filter((a) => a.column === "TODO").length,
    DOING: actions.filter((a) => a.column === "DOING").length,
    DONE: actions.filter((a) => a.column === "DONE").length,
  };
  const needsOwner = actions.filter((a) => !a.ownerName).length;
  const proposed = actions.filter((a) => a.approvalStatus === "PROPOSED").length;
  const memConfirmed = memory.filter((m) => m.status === "confirmed").length;
  const memProposed = memory.filter((m) => m.status === "proposed").length;
  const memDisputed = memory.filter((m) => m.status === "disputed").length;
  const approvalRate =
    actions.length === 0
      ? 0
      : actions.filter((a) => a.approvalStatus === "APPROVED").length /
        actions.length;

  const evidenceByType = Object.entries(
    evidence.reduce<Record<string, number>>((acc, src) => {
      const key = src.type.replaceAll("_", " ").split(" ")[0] ?? src.type;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([label, value]) => ({ label, value }));

  const recentMemory = [...memory]
    .sort((a, b) => b.lastConfirmedAt.localeCompare(a.lastConfirmedAt))
    .slice(0, 4);

  return (
    <div className="stagger mx-auto max-w-5xl space-y-5">
      <PageHeader
        title={initiative.name}
        description={initiative.objective}
      />

      <OnboardingChecklist />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={healthTone(initiative.health)}>{initiative.health}</Badge>
        <Badge tone="neutral">{initiative.stage}</Badge>
        {initiative.deadline ? (
          <Badge tone="amber">Due {initiative.deadline}</Badge>
        ) : null}
      </div>

      <StatStrip
        items={[
          { label: "Actions", value: actions.length, hint: `${proposed} proposed` },
          { label: "Needs owner", value: needsOwner, hint: "Human assign" },
          {
            label: "Memory",
            value: memory.length,
            hint: `${memConfirmed} confirmed`,
          },
          { label: "Evidence", value: evidence.length, hint: "Sources" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-4">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-dim">
            Board mix
          </p>
          <SegmentBar
            segments={[
              {
                value: boardCounts.TODO,
                tone: "var(--amber)",
                label: "Todo",
              },
              {
                value: boardCounts.DOING,
                tone: "var(--accent)",
                label: "Doing",
              },
              {
                value: boardCounts.DONE,
                tone: "var(--green)",
                label: "Done",
              },
            ]}
          />
        </Panel>
        <Panel className="p-4">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-dim">
            Memory status
          </p>
          <SegmentBar
            segments={[
              {
                value: memConfirmed,
                tone: "var(--green)",
                label: "Confirmed",
              },
              {
                value: memProposed,
                tone: "var(--blue)",
                label: "Proposed",
              },
              {
                value: memDisputed,
                tone: "var(--amber)",
                label: "Disputed",
              },
            ]}
          />
        </Panel>
        <Panel className="flex items-center justify-between gap-3 p-4">
          <RingProgress
            value={approvalRate}
            tone={approvalRate > 0.5 ? "green" : "amber"}
            label={`${Math.round(approvalRate * 100)}%`}
            sublabel="Actions approved"
          />
          <MiniBars
            className="min-w-0 flex-1"
            values={evidenceByType}
            barClassName="bg-blue"
          />
        </Panel>
      </div>

      <Panel className="p-4">
        <p className="text-[13px] leading-relaxed text-foreground">
          {initiative.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {initiative.successMetrics.map((metric) => (
            <span
              key={metric}
              className="rounded-md border border-border bg-surface-raised px-2 py-0.5 text-[11px] text-muted"
            >
              {metric}
            </span>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Latest Luci"
            description={
              latestRun
                ? `${latestRun.type.replaceAll("_", " ")} · ${formatRelativeTime(latestRun.completedAt ?? latestRun.createdAt)}`
                : undefined
            }
            action={
              latestRun ? (
                <Badge tone={runStatusTone(latestRun.status)}>Ready</Badge>
              ) : null
            }
          />
          {latestRun ? (
            <div className="space-y-3 p-4">
              <p className="text-[13px] leading-relaxed text-foreground">
                {latestRun.opinion}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {latestRun.synthesis.slice(0, 4).map((block) => (
                  <Badge key={block.id} tone="neutral">
                    {block.kind}
                  </Badge>
                ))}
              </div>
              <Link
                href={`/initiatives/${initiativeId}/runs/${latestRun.id}`}
                className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline focus-ring rounded"
              >
                Open result
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted">No runs yet.</p>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Blockers"
            description={`${needsOwner + proposed} open`}
            action={
              <Link
                href={`/initiatives/${initiativeId}/board`}
                className="text-xs text-accent hover:underline"
              >
                Board
              </Link>
            }
          />
          <ul>
            {actions.slice(0, 5).map((action) => (
              <li
                key={action.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-foreground">
                    {action.title}
                  </p>
                  <p className="text-[11px] text-muted">
                    {columnLabel(action.column)}
                    {action.ownerName ? ` · ${action.ownerName}` : ""}
                  </p>
                </div>
                {!action.ownerName ? (
                  <AlertTriangle className="size-3.5 shrink-0 text-amber" />
                ) : (
                  <Badge
                    tone={
                      action.approvalStatus === "APPROVED" ? "green" : "blue"
                    }
                  >
                    {action.approvalStatus === "PROPOSED" ? "Proposed" : "Ok"}
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
            title="Memory"
            action={
              <Link
                href={`/initiatives/${initiativeId}/memory`}
                className="text-xs text-accent hover:underline"
              >
                All
              </Link>
            }
          />
          <ul>
            {recentMemory.map((mem) => (
              <li
                key={mem.id}
                className="flex items-start justify-between gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
              >
                <p className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                  {mem.statement}
                </p>
                <Badge tone={memoryStatusTone(mem.status)}>{mem.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Runs" />
          <ul>
            {runs.map((run) => (
              <li key={run.id} className="border-b border-border last:border-b-0">
                <Link
                  href={`/initiatives/${initiativeId}/runs/${run.id}`}
                  className="linear-row flex items-center justify-between gap-3 px-4 py-2.5 focus-ring"
                >
                  <span className="text-[13px] text-foreground">
                    {run.type.replaceAll("_", " ")}
                  </span>
                  <Badge tone={runStatusTone(run.status)}>
                    {run.status === "COMPLETED" ? "Done" : run.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
