"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useMosaicStore } from "@/components/mosaic-store";
import { Check, GitBranch, Play, X } from "lucide-react";

export const RemediationPanel = () => {
  const {
    findings,
    remediations,
    generateRemediationsVisible,
    updateRemediation,
    approveRemediation,
    rejectRemediation,
    executeRemediation,
  } = useMosaicStore();

  const acceptedIds = new Set(
    findings.filter((f) => f.status === "ACCEPTED").map((f) => f.id),
  );
  const visible = remediations.filter((r) => acceptedIds.has(r.findingId));

  if (!generateRemediationsVisible) {
    return (
      <Panel className="p-5">
        <p className="text-sm text-muted">
          Accept at least one finding, then generate remediations. Luci only
          proposes actions for accepted findings.
        </p>
      </Panel>
    );
  }

  if (!visible.length) {
    return (
      <Panel className="p-5">
        <p className="text-sm text-muted">
          No remediations available for the currently accepted findings.
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Remediation review"
        description="Edit, approve, or reject each action. External execution is simulated in this prototype."
      />
      <div className="divide-y divide-border">
        {visible.map((action) => {
          const finding = findings.find((f) => f.id === action.findingId);
          const isApproved =
            action.approvalStatus === "APPROVED" ||
            action.approvalStatus === "EDITED";
          return (
            <article key={action.id} className="space-y-3 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="purple">{action.type.replaceAll("_", " ")}</Badge>
                <Badge tone="neutral">{action.targetSystem}</Badge>
                <Badge
                  tone={
                    action.executionStatus === "COMPLETED"
                      ? "green"
                      : action.executionStatus === "BLOCKED"
                        ? "amber"
                        : "neutral"
                  }
                >
                  {action.approvalStatus} · {action.executionStatus}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold">{action.title}</h3>
              <p className="text-xs text-muted">
                Finding: {finding?.title ?? action.findingId}
              </p>

              <label className="block space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-dim">
                  Proposed content
                </span>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-border bg-black/30 p-3 font-mono text-xs text-foreground outline-none focus:border-lime/40"
                  value={action.content}
                  onChange={(e) =>
                    updateRemediation(action.id, { content: e.target.value })
                  }
                />
              </label>

              {action.requiresHumanInput ? (
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-dim">
                    {action.humanInputLabel ?? "Human input"}
                  </span>
                  <input
                    className="h-9 w-full rounded-lg border border-border bg-black/30 px-3 text-sm outline-none focus:border-lime/40"
                    placeholder="Required before execute"
                    value={action.humanInputValue ?? ""}
                    onChange={(e) =>
                      updateRemediation(action.id, {
                        humanInputValue: e.target.value,
                      })
                    }
                  />
                </label>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Check className="size-3.5" />}
                  onClick={() => approveRemediation(action.id)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<X className="size-3.5" />}
                  onClick={() => rejectRemediation(action.id)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={
                    action.targetSystem === "GitHub" ? (
                      <GitBranch className="size-3.5" />
                    ) : (
                      <Play className="size-3.5" />
                    )
                  }
                  disabled={!isApproved}
                  onClick={() => executeRemediation(action.id)}
                >
                  Execute (simulated)
                </Button>
              </div>

              {action.simulatedNote ? (
                <p className="rounded-lg border border-lime/25 bg-lime-soft px-3 py-2 text-xs text-lime">
                  {action.simulatedNote}
                  {action.externalUrl ? (
                    <>
                      {" "}
                      <span className="underline underline-offset-2">
                        {action.externalUrl}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}

              {action.executionStatus === "BLOCKED" ? (
                <p className="rounded-lg border border-amber/30 bg-amber-soft px-3 py-2 text-xs text-amber">
                  Blocked until human owner/deadline is supplied. Luci will not
                  invent one.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </Panel>
  );
};
