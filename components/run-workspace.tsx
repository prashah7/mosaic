"use client";

import { AgentFlow } from "@/components/agent-flow";
import { FindingsPanel } from "@/components/findings-panel";
import { MosaicStoreProvider, useMosaicStore } from "@/components/mosaic-store";
import { RemediationPanel } from "@/components/remediation-panel";
import { VerificationPanel } from "@/components/verification-panel";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { readinessTone, runStatusTone } from "@/components/ui/status";
import type { AgentTask, Initiative, Run, RunEvent } from "@/lib/types";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { useState } from "react";

type Tab = "trace" | "findings" | "remediation" | "verification";

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
}) => (
  <MosaicStoreProvider runId={run.id}>
    <RunWorkspaceInner
      initiative={initiative}
      run={run}
      tasks={tasks}
      events={events}
    />
  </MosaicStoreProvider>
);

const RunWorkspaceInner = ({
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
  const { score, label, findings } = useMosaicStore();
  const [tab, setTab] = useState<Tab>("trace");

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "trace", label: "Live trace" },
    { id: "findings", label: `Findings (${findings.length})` },
    { id: "remediation", label: "Remediation" },
    { id: "verification", label: "Verification" },
  ];

  return (
    <div className="stagger mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={runStatusTone(run.status)}>{run.status}</Badge>
            <Badge tone="purple">{run.type.replaceAll("_", " ")}</Badge>
            <Badge tone={readinessTone(label as Initiative["status"])}>
              Score {score} · {label.replaceAll("_", " ")}
            </Badge>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white sm:text-4xl">
            Luci run
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            {initiative.name} · {run.instruction}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-dim">
            Duration
          </p>
          <p className="font-mono text-lg text-foreground">
            {formatDuration(run.durationMs)}
          </p>
          <p className="text-[11px] text-muted">
            {run.completedAt ? formatRelativeTime(run.completedAt) : "running"} ·{" "}
            {run.triggeredBy}
          </p>
        </div>
      </div>

      <Panel className="p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-foreground/90">
          {run.opinion}
        </p>
        <p className="mt-2 text-xs text-muted-dim">
          Recommendations must be reviewed before use in production. Luci does
          not invent owners, deadlines, or scope decisions.
        </p>
      </Panel>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition focus-ring ${
              tab === item.id
                ? "bg-lime font-semibold text-black"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "trace" ? (
        <div className="space-y-4">
          <AgentFlow
            tasks={tasks}
            events={events}
            instruction={run.instruction}
            resultSummary={run.opinion}
          />
          <Panel>
            <PanelHeader
              title="Task ledger"
              description="Inputs, outputs, and duration for each agent"
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-border text-muted-dim">
                  <tr>
                    <th className="px-4 py-2 font-medium">Agent</th>
                    <th className="px-4 py-2 font-medium">Task</th>
                    <th className="px-4 py-2 font-medium">Input</th>
                    <th className="px-4 py-2 font-medium">Output</th>
                    <th className="px-4 py-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-border/70">
                      <td className="px-4 py-3 text-purple">{task.agentType}</td>
                      <td className="px-4 py-3 text-foreground">{task.task}</td>
                      <td className="px-4 py-3 text-muted">{task.inputSummary}</td>
                      <td className="px-4 py-3 text-muted">
                        {task.outputSummary}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted">
                        {formatDuration(task.durationMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === "findings" ? <FindingsPanel /> : null}
      {tab === "remediation" ? <RemediationPanel /> : null}
      {tab === "verification" ? <VerificationPanel /> : null}
    </div>
  );
};
