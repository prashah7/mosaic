import Link from "next/link";
import {
  activityFeed,
  getFindingsForRun,
  getTasksForRun,
  initiatives,
  runs,
  workspace,
} from "@/lib/mosaic-data";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SparkGrid } from "@/components/ui/spark-grid";
import {
  readinessTone,
  runStatusTone,
  StatusDot,
} from "@/components/ui/status";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Layers3,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

export default function DashboardPage() {
  const attention = initiatives.filter((i) => (i.openFindings ?? 0) > 0);
  const activeAgents = 4;
  const successRate = 91;
  const blockedHuman = 8;
  const critical = initiatives.reduce(
    (acc, i) =>
      acc + (i.status === "NOT_READY" || i.status === "AT_RISK" ? 1 : 0),
    0,
  );
  const latestRun = runs[0];
  const latestTasks = getTasksForRun(latestRun.id);
  const latestFindings = getFindingsForRun(latestRun.id);

  return (
    <div className="stagger mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {attention.reduce((a, i) => a + i.openFindings, 0)} issues need
            attention across {attention.length} active initiatives.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="purple" icon={<StatusDot tone="purple" live />}>
            Active
          </Badge>
          <Badge tone="neutral">DEMO STATE</Badge>
          <p className="w-full text-right text-[11px] text-muted-dim sm:w-auto">
            Live operations with runs, logs, and governance.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active agents"
          value={String(activeAgents)}
          tone="purple"
          seed="agents"
        />
        <MetricCard
          label="Success rate"
          value={`${successRate}%`}
          tone="green"
          seed="success"
        />
        <MetricCard
          label="Human blockers"
          value={String(blockedHuman)}
          tone="amber"
          seed="blocked"
        />
        <MetricCard
          label="At-risk initiatives"
          value={String(critical)}
          tone="red"
          seed="critical"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <PanelHeader
            title="Workspace summary"
            description={`${workspace.companyName} · private MVP workspace`}
          />
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
            <SummaryCell
              label="Status"
              value={
                <Badge tone="amber" icon={<AlertTriangle className="size-3" />}>
                  Degraded
                </Badge>
              }
            />
            <SummaryCell label="Active flows" value="4" />
            <SummaryCell label="Evidence sources" value="8" />
            <SummaryCell label="Initiatives" value={String(initiatives.length)} />
            <SummaryCell
              label="Last run"
              value={
                latestRun.completedAt
                  ? formatRelativeTime(latestRun.completedAt)
                  : "—"
              }
            />
            <SummaryCell label="Environment" value="Sandbox" />
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Recent executions"
            description={`${latestRun.type.replaceAll("_", " ")} · ${formatDuration(latestRun.durationMs)} · ${latestRun.triggeredBy}`}
            action={
              <div className="flex items-center gap-2">
                <Badge tone={runStatusTone(latestRun.status)}>
                  {latestRun.status === "COMPLETED"
                    ? "Success"
                    : latestRun.status}
                </Badge>
                <span className="text-[11px] text-muted">
                  {latestRun.completedAt
                    ? formatRelativeTime(latestRun.completedAt)
                    : ""}
                </span>
              </div>
            }
          />
          <div className="dot-grid space-y-4 p-4 sm:p-5">
            <div className="rounded-xl border border-blue/25 bg-blue-soft/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                User prompt
              </p>
              <p className="mt-1 text-sm text-foreground">
                {latestRun.instruction}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="rounded-xl border border-purple/25 bg-purple-soft/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Luci plan
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {latestTasks[0]?.outputSummary}
                </p>
              </div>
              <ArrowRight className="mx-auto hidden size-4 text-muted-dim md:block" />
              <div className="space-y-2">
                {latestFindings.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg border border-border bg-surface-raised/90 px-3 py-2 text-xs"
                  >
                    <span className="text-amber">{f.severity}</span> · {f.title}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-lime/25 bg-lime-soft/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Result
              </p>
              <p className="mt-1 text-sm text-foreground">
                Score {latestRun.score} · {latestFindings.length} findings ready
                for PM review
              </p>
            </div>
            <Link
              href={`/initiatives/init_sso/runs/${latestRun.id}`}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-lime px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-lime-dim focus-ring"
            >
              <Sparkles className="size-3.5" />
              Open run trace
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <PanelHeader
            title="Initiatives needing attention"
            description="Evidence-backed gaps and readiness health"
            action={
              <Link
                href="/initiatives/init_sso"
                className="rounded text-xs text-lime hover:underline focus-ring"
              >
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-border">
            {initiatives.map((initiative) => (
              <li key={initiative.id}>
                <Link
                  href={`/initiatives/${initiative.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-white/[0.03] sm:px-5 focus-ring"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {initiative.name}
                      </p>
                      <Badge tone={readinessTone(initiative.status)}>
                        {initiative.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      {initiative.objective}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="font-mono text-lg text-foreground">
                        {initiative.currentScore ?? "—"}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-dim">
                        score
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-lg text-amber">
                        {initiative.openFindings}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-dim">
                        findings
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title="Activity"
            description="Attributable events across the workspace"
          />
          <ul className="divide-y divide-border">
            {activityFeed.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block px-4 py-3.5 transition hover:bg-white/[0.03] sm:px-5 focus-ring"
                >
                  <div className="flex items-center gap-2">
                    {item.kind === "run" ? (
                      <Layers3 className="size-3.5 text-purple" />
                    ) : item.kind === "finding" ? (
                      <AlertTriangle className="size-3.5 text-amber" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-green" />
                    )}
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-dim">
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

const MetricCard = ({
  label,
  value,
  tone,
  seed,
}: {
  label: string;
  value: string;
  tone: "purple" | "green" | "amber" | "red";
  seed: string;
}) => (
  <Panel className="p-4">
    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
      {label}
    </p>
    <div className="mt-3 flex items-end justify-between gap-3">
      <p className="font-[family-name:var(--font-display)] text-4xl leading-none text-white">
        {value}
      </p>
      <SparkGrid seed={seed} tone={tone} className="w-[88px]" />
    </div>
  </Panel>
);

const SummaryCell = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <div className="bg-surface px-4 py-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
      {label}
    </p>
    <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
  </div>
);
