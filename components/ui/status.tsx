import { cn } from "@/lib/utils";
import type {
  InitiativeHealth,
  KanbanColumn,
  MemoryStatus,
  RunStatus,
  TaskStatus,
} from "@/lib/types";

export const healthTone = (
  health: InitiativeHealth,
): "green" | "amber" | "red" | "neutral" | "purple" => {
  if (health === "On track") return "green";
  if (health === "At risk" || health === "Needs attention") return "amber";
  if (health === "Blocked") return "red";
  return "neutral";
};

export const runStatusTone = (
  status: RunStatus,
): "green" | "purple" | "amber" | "red" | "neutral" => {
  if (status === "COMPLETED") return "green";
  if (status === "FAILED" || status === "CANCELLED") return "red";
  if (status === "CREATED") return "neutral";
  return "purple";
};

export const memoryStatusTone = (
  status: MemoryStatus,
): "green" | "amber" | "red" | "neutral" | "blue" => {
  if (status === "confirmed") return "green";
  if (status === "proposed") return "blue";
  if (status === "disputed") return "amber";
  if (status === "superseded") return "neutral";
  return "neutral";
};

export const columnLabel = (column: KanbanColumn): string => {
  if (column === "TODO") return "Todo";
  if (column === "DOING") return "Doing";
  return "Done";
};

export const taskStatusClass = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    WAITING: "text-muted bg-white/[0.04] border-border",
    READY: "text-blue bg-blue-soft border-blue/20",
    RUNNING: "text-accent bg-accent-soft border-accent/25",
    BLOCKED: "text-amber bg-amber-soft border-amber/20",
    COMPLETED: "text-green bg-green-soft border-green/20",
    FAILED: "text-red bg-red-soft border-red/20",
    CANCELLED: "text-muted bg-white/[0.04] border-border",
  };
  return map[status];
};

export const StatusDot = ({
  tone = "neutral",
  live = false,
  className,
}: {
  tone?: "lime" | "purple" | "amber" | "red" | "green" | "blue" | "neutral";
  live?: boolean;
  className?: string;
}) => {
  const colors = {
    lime: "bg-accent",
    purple: "bg-accent",
    amber: "bg-amber",
    red: "bg-red",
    green: "bg-green",
    blue: "bg-blue",
    neutral: "bg-muted-dim",
  };
  return (
    <span
      className={cn(
        "inline-block size-1.5 rounded-full",
        colors[tone],
        live && "live-dot",
        className,
      )}
      aria-hidden
    />
  );
};

/** Compatibility aliases while old pages are removed */
export const readinessTone = healthTone;
export const severityTone = (
  severity: string,
): "red" | "amber" | "blue" | "neutral" => {
  if (severity === "CRITICAL") return "red";
  if (severity === "HIGH") return "amber";
  if (severity === "MEDIUM") return "blue";
  return "neutral";
};
export const findingStatusTone = memoryStatusTone;
