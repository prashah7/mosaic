import type {
  Finding,
  FindingStatus,
  ReadinessCategory,
  ReadinessLabel,
  Severity,
} from "@/lib/types";

const SEVERITY_PENALTY: Record<Severity, number> = {
  CRITICAL: 18,
  HIGH: 12,
  MEDIUM: 7,
  LOW: 3,
};

const CATEGORY_WEIGHTS: Array<{ id: string; label: string; weight: number }> = [
  { id: "intent", label: "Product intent clarity", weight: 15 },
  { id: "spec", label: "Specification completeness", weight: 20 },
  { id: "trace", label: "Traceability", weight: 25 },
  { id: "ownership", label: "Ownership and accountability", weight: 15 },
  { id: "measurement", label: "Measurement readiness", weight: 10 },
  { id: "risk", label: "Risk and dependency readiness", weight: 10 },
  { id: "decision", label: "Decision documentation", weight: 5 },
];

const STANDARD_CATEGORY: Record<string, string> = {
  std_launch_req: "trace",
  std_critical_owner: "ownership",
  std_acceptance: "spec",
  std_scope: "intent",
  std_decision: "decision",
  std_commitment: "ownership",
  std_metric: "measurement",
  std_dependency: "risk",
  std_assumption: "intent",
  std_supported_work: "trace",
};

const SCOREABLE: FindingStatus[] = [
  "OPEN",
  "ACCEPTED",
  "ACCEPTED_RISK",
  "PARTIALLY_RESOLVED",
];

export const labelForScore = (score: number): ReadinessLabel => {
  if (score >= 90) return "READY";
  if (score >= 75) return "CONDITIONALLY_READY";
  if (score >= 50) return "AT_RISK";
  return "NOT_READY";
};

export const readinessBreakdown = (
  findings: Finding[],
): { score: number; label: ReadinessLabel; categories: ReadinessCategory[] } => {
  const impacts = new Map<string, number>();
  CATEGORY_WEIGHTS.forEach((c) => impacts.set(c.id, 0));

  findings
    .filter((f) => SCOREABLE.includes(f.status) && f.status !== "RESOLVED")
    .forEach((finding) => {
      const categoryId = STANDARD_CATEGORY[finding.standardId] ?? "trace";
      const current = impacts.get(categoryId) ?? 0;
      const weight =
        CATEGORY_WEIGHTS.find((c) => c.id === categoryId)?.weight ?? 10;
      const next = Math.min(
        weight,
        current + SEVERITY_PENALTY[finding.severity],
      );
      impacts.set(categoryId, next);
    });

  const totalImpact = Array.from(impacts.values()).reduce((a, b) => a + b, 0);
  const score = Math.max(0, 100 - totalImpact);
  const categories = CATEGORY_WEIGHTS.map((c) => ({
    ...c,
    impact: impacts.get(c.id) ?? 0,
  }));

  return { score, label: labelForScore(score), categories };
};
