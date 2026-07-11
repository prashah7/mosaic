"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { findingStatusTone, severityTone } from "@/components/ui/status";
import { useMosaicStore } from "@/components/mosaic-store";
import type { FindingStatus } from "@/lib/types";
import { AlertTriangle, Check, MessageSquareWarning, X } from "lucide-react";

const actions: Array<{
  status: FindingStatus;
  label: string;
  icon: typeof Check;
}> = [
  { status: "ACCEPTED", label: "Accept", icon: Check },
  { status: "REJECTED", label: "Reject", icon: X },
  { status: "ACCEPTED_RISK", label: "Accept risk", icon: AlertTriangle },
];

export const FindingsPanel = () => {
  const { findings, updateFindingStatus, setGenerateRemediationsVisible } =
    useMosaicStore();

  const acceptedCount = findings.filter((f) => f.status === "ACCEPTED").length;

  return (
    <Panel>
      <PanelHeader
        title="Findings review"
        description="Accept findings before Luci generates remediations. Evidence links are required."
        action={
          <Button
            size="sm"
            variant="primary"
            disabled={acceptedCount === 0}
            onClick={() => setGenerateRemediationsVisible(true)}
          >
            Generate remediations ({acceptedCount})
          </Button>
        }
      />
      <div className="divide-y divide-border">
        {findings.map((finding) => (
          <article key={finding.id} className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={severityTone(finding.severity)}>
                    {finding.severity}
                  </Badge>
                  <Badge tone="neutral">{finding.category}</Badge>
                  <Badge tone={findingStatusTone(finding.status)}>
                    {finding.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {finding.title}
                </h3>
              </div>
              <span className="font-mono text-[11px] text-muted">
                conf {(finding.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-sm leading-relaxed text-muted">
              {finding.description}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-black/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-dim">
                  Standard
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {finding.standardLabel}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-black/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-dim">
                  Business impact
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {finding.businessImpact}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-dim">
                Evidence
              </p>
              <ul className="space-y-1">
                {finding.evidenceRefs.map((ref) => (
                  <li
                    key={ref}
                    className="flex items-start gap-2 text-xs text-muted"
                  >
                    <MessageSquareWarning className="mt-0.5 size-3.5 shrink-0 text-amber" />
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>

            {finding.requiresHumanInput ? (
              <p className="rounded-lg border border-amber/30 bg-amber-soft px-3 py-2 text-xs text-amber">
                {finding.humanInputNote ?? "Human input required"} — Luci will
                not invent an owner or deadline.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {actions.map(({ status, label, icon: Icon }) => (
                <Button
                  key={status}
                  size="sm"
                  variant={finding.status === status ? "primary" : "outline"}
                  leftIcon={<Icon className="size-3.5" />}
                  onClick={() => updateFindingStatus(finding.id, status)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
};
