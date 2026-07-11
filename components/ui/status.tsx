import { cn } from "@/lib/utils";
import type {
  FindingStatus,
  ReadinessLabel,
  RunStatus,
  Severity,
  TaskStatus,
} from "@/lib/types";

export const severityTone = (
  severity: Severity,
): "red" | "amber" | "blue" | "neutral" => {
  if (severity === "CRITICAL") return "red";
  if (severity === "HIGH") return "amber";
  if (severity === "MEDIUM") return "blue";
  return "neutral";
};

export const readinessTone = (
  status: ReadinessLabel,
): "green" | "lime" | "amber" | "red" | "neutral" => {
  if (status === "READY") return "green";
  if (status === "CONDITIONALLY_READY") return "lime";
  if (status === "AT_RISK") return "amber";
  if (status === "NOT_READY") return "red";
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

export const findingStatusTone = (
  status: FindingStatus,
): "green" | "lime" | "amber" | "red" | "neutral" | "blue" => {
  if (status === "RESOLVED") return "green";
  if (status === "PARTIALLY_RESOLVED") return "lime";
  if (status === "ACCEPTED") return "blue";
  if (status === "ACCEPTED_RISK") return "amber";
  if (status === "REJECTED") return "neutral";
  return "red";
};

export const taskStatusClass = (status: TaskStatus): string => {
  const map: Record<TaskStatus, string> = {
    WAITING: "text-muted bg-white/5 border-border",
    READY: "text-blue bg-blue-soft border-blue/25",
    RUNNING: "text-purple bg-purple-soft border-purple/25",
    BLOCKED: "text-amber bg-amber-soft border-amber/25",
    COMPLETED: "text-green bg-green-soft border-green/25",
    FAILED: "text-red bg-red-soft border-red/25",
    CANCELLED: "text-muted bg-white/5 border-border",
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
    lime: "bg-lime",
    purple: "bg-purple",
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
