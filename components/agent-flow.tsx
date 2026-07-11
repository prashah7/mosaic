import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusDot, taskStatusClass } from "@/components/ui/status";
import type { AgentTask, RunEvent } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { ArrowRight, Bot, Wrench } from "lucide-react";

const agentLabel: Record<string, string> = {
  LUCI: "Luci",
  EVIDENCE: "Evidence Agent",
  TRACEABILITY: "Traceability Agent",
  STANDARDS: "Standards Agent",
  COORDINATION: "Coordination Agent",
  REMEDIATION: "Remediation Agent",
  VERIFICATION: "Verification Agent",
};

export const AgentFlow = ({
  tasks,
  events,
  instruction,
  resultSummary,
}: {
  tasks: AgentTask[];
  events: RunEvent[];
  instruction: string;
  resultSummary?: string;
}) => {
  const toolish = tasks.filter((t) => t.agentType !== "LUCI");

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title="Observable workflow"
        description="Structured task summaries only — no hidden chain-of-thought."
        action={
          <Badge tone="green" icon={<StatusDot tone="green" live />}>
            Trace complete
          </Badge>
        }
      />
      <div className="dot-grid relative min-h-[320px] p-4 sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
          <div className="space-y-3">
            <FlowCard eyebrow="User prompt" title={instruction} tone="blue" />
            <FlowCard
              eyebrow="Agent reasoning"
              title="Identified readiness gaps across ownership, scope contradiction, and missing execution tickets — preserving null owners."
              tone="purple"
            />
          </div>

          <div className="flex flex-col justify-center gap-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
              Specialist path
            </p>
            {toolish.map((task, index) => (
              <div key={task.id} className="relative">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised/90 px-3 py-2.5 backdrop-blur">
                  <Wrench className="size-3.5 text-lime" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {agentLabel[task.agentType]}.{task.agentType.toLowerCase()}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {task.outputSummary}
                    </p>
                  </div>
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] ${taskStatusClass(task.status)}`}
                  >
                    {task.status}
                  </span>
                </div>
                {index < toolish.length - 1 ? (
                  <div className="absolute -bottom-2 left-5 text-muted-dim">
                    <ArrowRight className="size-3 rotate-90" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <FlowCard
              eyebrow="Result"
              title={
                resultSummary ??
                "Readiness score published with five evidence-backed findings."
              }
              tone="lime"
            />
            <div className="rounded-xl border border-border bg-surface-raised/90 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                <Bot className="size-3.5 text-purple" />
                Live event stream
              </div>
              <ul className="max-h-40 space-y-2 overflow-y-auto scrollbar-thin">
                {events.map((event) => (
                  <li key={event.id} className="text-[11px] leading-relaxed">
                    <span
                      className={
                        event.level === "ERROR"
                          ? "text-red"
                          : event.level === "WARNING"
                            ? "text-amber"
                            : "text-muted"
                      }
                    >
                      [{event.level}]
                    </span>{" "}
                    <span className="text-foreground/90">{event.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-5">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="min-w-[180px] rounded-lg border border-border bg-black/20 px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-dim">
                {agentLabel[task.agentType]}
              </p>
              <p className="mt-1 text-xs text-foreground">{task.task}</p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                {formatDuration(task.durationMs)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};

const FlowCard = ({
  eyebrow,
  title,
  tone,
}: {
  eyebrow: string;
  title: string;
  tone: "blue" | "purple" | "lime";
}) => {
  const tones = {
    blue: "border-blue/30 bg-blue-soft/40",
    purple: "border-purple/30 bg-purple-soft/40",
    lime: "border-lime/30 bg-lime-soft/40",
  };
  return (
    <div className={`rounded-xl border p-3.5 backdrop-blur ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {eyebrow}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{title}</p>
    </div>
  );
};
