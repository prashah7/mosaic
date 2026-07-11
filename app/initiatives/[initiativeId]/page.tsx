import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidencePanel } from "@/components/evidence-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { readinessTone, severityTone } from "@/components/ui/status";
import {
  decisions,
  dependencies,
  findings,
  getEvidenceForInitiative,
  getInitiative,
  getRunsForInitiative,
  risks,
  workstreams,
} from "@/lib/mosaic-data";
import { readinessBreakdown } from "@/lib/readiness";
import { formatRelativeTime } from "@/lib/utils";
import { Calendar, Sparkles, Target, Users } from "lucide-react";
import type { ReactNode } from "react";

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default async function InitiativePage({ params }: PageProps) {
  const { initiativeId } = await params;
  const initiative = getInitiative(initiativeId);
  if (!initiative) notFound();

  const evidence = getEvidenceForInitiative(initiativeId);
  const initiativeRuns = getRunsForInitiative(initiativeId);
  const runFindings =
    initiativeId === "init_sso"
      ? findings.filter((f) => f.runId === "run_sso_1")
      : [];
  const breakdown = readinessBreakdown(runFindings);

  return (
    <div className="stagger mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={readinessTone(initiative.status)}>
              {initiative.status.replaceAll("_", " ")}
            </Badge>
            <Badge tone="neutral">{initiative.stage}</Badge>
            {initiative.currentScore != null ? (
              <Badge tone="purple">Score {initiative.currentScore}</Badge>
            ) : null}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white sm:text-4xl">
            {initiative.name}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {initiative.objective}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {initiative.activeRunId ? (
            <Link
              href={`/initiatives/${initiative.id}/runs/${initiative.activeRunId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-lime px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-lime-dim focus-ring"
            >
              <Sparkles className="size-4" />
              Open Luci run
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="size-4" />}
            >
              Start Luci run
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile
          icon={<Target className="size-4 text-lime" />}
          label="Success metrics"
          value={`${initiative.successMetrics.length} tracked`}
        />
        <InfoTile
          icon={<Calendar className="size-4 text-amber" />}
          label="Deadline"
          value={initiative.deadline ?? "Human deadline required"}
        />
        <InfoTile
          icon={<Users className="size-4 text-purple" />}
          label="Owner"
          value={initiative.ownerName ?? "Human assignment required"}
        />
        <InfoTile
          icon={<Sparkles className="size-4 text-blue" />}
          label="Open findings"
          value={String(initiative.openFindings)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel>
          <PanelHeader
            title="Initiative brief"
            description="Product direction stays with the PM"
          />
          <div className="space-y-4 px-4 py-4 sm:px-5">
            {initiative.description ? (
              <p className="text-sm text-muted">{initiative.description}</p>
            ) : null}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
                Success metrics
              </p>
              <ul className="mt-2 space-y-1.5">
                {initiative.successMetrics.map((metric) => (
                  <li
                    key={metric}
                    className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm text-foreground"
                  >
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
                Stakeholders
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {initiative.stakeholders.map((s) => (
                  <Badge key={s} tone="neutral">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Readiness breakdown"
            description="Deterministic penalties from open/accepted findings"
          />
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex items-end justify-between">
              <p className="font-[family-name:var(--font-display)] text-5xl text-white">
                {initiativeId === "init_sso"
                  ? breakdown.score
                  : (initiative.currentScore ?? "—")}
              </p>
              <Badge tone={readinessTone(initiative.status)}>
                {(initiativeId === "init_sso"
                  ? breakdown.label
                  : initiative.status
                ).replaceAll("_", " ")}
              </Badge>
            </div>
            {initiativeId === "init_sso" ? (
              <ul className="space-y-2">
                {breakdown.categories.map((cat) => (
                  <li key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">{cat.label}</span>
                      <span className="font-mono text-foreground">
                        −{cat.impact}/{cat.weight}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber to-red"
                        style={{
                          width: `${(cat.impact / cat.weight) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                No readiness audit seeded for this initiative yet.
              </p>
            )}
          </div>
        </Panel>
      </div>

      {initiativeId === "init_sso" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <ListCard
              title="Workstreams"
              items={workstreams.map((w) => ({
                title: w.name,
                meta: w.owner ?? "Needs owner",
                badge: w.status,
              }))}
            />
            <ListCard
              title="Decisions"
              items={decisions.map((d) => ({
                title: d.statement,
                meta: d.source,
                badge: d.status,
              }))}
            />
            <ListCard
              title="Risks"
              items={risks.map((r) => ({
                title: r.title,
                meta: r.owner ?? "Human assignment required",
                badge: r.severity,
                tone: severityTone(r.severity),
              }))}
            />
            <ListCard
              title="Dependencies"
              items={dependencies.map((d) => ({
                title: d.title,
                meta: d.team,
                badge: d.status,
              }))}
            />
          </div>

          <EvidencePanel initialEvidence={evidence} />
        </>
      ) : (
        <Panel className="p-6">
          <p className="text-sm text-muted">
            Seeded deep-dive content is available on the Enterprise SSO launch
            initiative. Use that path to walk the full Luci loop.
          </p>
          <Link
            href="/initiatives/init_sso"
            className="mt-4 inline-flex items-center rounded-lg bg-lime px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-lime-dim focus-ring"
          >
            Open Enterprise SSO
          </Link>
        </Panel>
      )}

      <Panel>
        <PanelHeader
          title="Run history"
          description="Immutable workflow executions"
        />
        {initiativeRuns.length ? (
          <ul className="divide-y divide-border">
            {initiativeRuns.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/initiatives/${initiative.id}/runs/${run.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.03] sm:px-5 focus-ring"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {run.type.replaceAll("_", " ")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{run.instruction}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone="green">{run.status}</Badge>
                    <p className="mt-1 text-[11px] text-muted-dim">
                      {run.completedAt
                        ? formatRelativeTime(run.completedAt)
                        : "in progress"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-muted">No runs yet.</p>
        )}
      </Panel>
    </div>
  );
}

const InfoTile = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => (
  <Panel className="flex items-start gap-3 p-4">
    <div className="rounded-lg border border-border bg-black/20 p-2">{icon}</div>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  </Panel>
);

const ListCard = ({
  title,
  items,
}: {
  title: string;
  items: Array<{
    title: string;
    meta: string;
    badge: string;
    tone?: "red" | "amber" | "blue" | "neutral" | "green" | "lime" | "purple";
  }>;
}) => (
  <Panel>
    <PanelHeader title={title} />
    <ul className="max-h-72 divide-y divide-border overflow-y-auto scrollbar-thin">
      {items.map((item) => (
        <li key={item.title} className="space-y-1.5 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium leading-snug text-foreground">
              {item.title}
            </p>
            <Badge tone={item.tone ?? "neutral"} className="shrink-0">
              {item.badge}
            </Badge>
          </div>
          <p className="text-[11px] text-muted">{item.meta}</p>
        </li>
      ))}
    </ul>
  </Panel>
);
