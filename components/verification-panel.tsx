"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useMosaicStore } from "@/components/mosaic-store";
import { ShieldCheck } from "lucide-react";

const outcomeTone = (
  outcome: string,
): "green" | "lime" | "amber" | "red" | "neutral" => {
  if (outcome === "RESOLVED") return "green";
  if (outcome === "PARTIALLY_RESOLVED") return "lime";
  if (outcome === "ACCEPTED_RISK") return "amber";
  if (outcome === "OPEN") return "red";
  return "neutral";
};

export const VerificationPanel = () => {
  const {
    remediations,
    verifications,
    runVerification,
    score,
    label,
    findings,
  } = useMosaicStore();

  const completed = remediations.filter(
    (r) => r.executionStatus === "COMPLETED",
  ).length;

  return (
    <Panel>
      <PanelHeader
        title="Independent verification"
        description="The verification agent cannot mark its own remediation verified."
        action={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<ShieldCheck className="size-3.5" />}
            disabled={completed === 0}
            onClick={runVerification}
          >
            Run verification
          </Button>
        }
      />
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-black/25 p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
              Live readiness
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-4xl text-foreground">
              {score}
            </p>
          </div>
          <Badge
            tone={
              label === "READY"
                ? "green"
                : label === "CONDITIONALLY_READY"
                  ? "lime"
                  : label === "AT_RISK"
                    ? "amber"
                    : "red"
            }
          >
            {label.replaceAll("_", " ")}
          </Badge>
        </div>

        {!verifications.length ? (
          <p className="text-sm text-muted">
            Execute at least one approved remediation, then run verification to
            see score movement and unresolved ownership.
          </p>
        ) : (
          <div className="space-y-3">
            {verifications.map((result) => {
              const finding = findings.find((f) => f.id === result.findingId);
              return (
                <div
                  key={result.id}
                  className="rounded-xl border border-border bg-surface-raised p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone={outcomeTone(result.outcome)}>
                      {result.outcome.replaceAll("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted">{finding?.title}</span>
                  </div>
                  <p className="text-sm text-foreground">{result.summary}</p>
                  {result.remainingRisk ? (
                    <p className="mt-2 text-xs text-amber">
                      Remaining: {result.remainingRisk}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
};
