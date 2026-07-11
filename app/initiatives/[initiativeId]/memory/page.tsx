"use client";

import { use, useEffect, useMemo } from "react";
import { useOnboarding } from "@/components/onboarding-provider";
import { useReviewStore } from "@/components/review-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConfidenceBar,
  MiniBars,
  SegmentBar,
} from "@/components/ui/dataviz";
import { Panel, PageHeader } from "@/components/ui/panel";
import { memoryStatusTone } from "@/components/ui/status";
import {
  getEvidenceById,
  getInitiative,
} from "@/lib/mosaic-data";

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default function MemoryPage({ params }: PageProps) {
  const { initiativeId } = use(params);
  const initiative = getInitiative(initiativeId);
  const { memory, approveMemory, rejectMemory } = useReviewStore();
  const { markProgress } = useOnboarding();

  useEffect(() => {
    markProgress("checked_memory");
  }, [markProgress]);

  const sorted = useMemo(
    () =>
      [...memory].sort((a, b) =>
        b.lastConfirmedAt.localeCompare(a.lastConfirmedAt),
      ),
    [memory],
  );

  const byStatus = useMemo(() => {
    const counts = { confirmed: 0, proposed: 0, disputed: 0, superseded: 0 };
    for (const m of memory) counts[m.status] += 1;
    return counts;
  }, [memory]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of memory) {
      map[m.type] = (map[m.type] ?? 0) + 1;
    }
    return Object.entries(map).map(([label, value]) => ({
      label: label.slice(0, 8),
      value,
    }));
  }, [memory]);

  if (!initiative) {
    return <p className="text-sm text-muted">Initiative not found.</p>;
  }

  return (
    <div className="stagger mx-auto max-w-3xl space-y-5">
      <PageHeader title="Memory" description={initiative.name} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel className="p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-muted-dim">
            Status
          </p>
          <SegmentBar
            segments={[
              {
                value: byStatus.confirmed,
                tone: "var(--green)",
                label: "Confirmed",
              },
              {
                value: byStatus.proposed,
                tone: "var(--blue)",
                label: "Proposed",
              },
              {
                value: byStatus.disputed,
                tone: "var(--amber)",
                label: "Disputed",
              },
              {
                value: byStatus.superseded,
                tone: "var(--muted-dim)",
                label: "Superseded",
              },
            ]}
          />
        </Panel>
        <Panel className="p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-muted-dim">
            By type
          </p>
          <MiniBars values={byType} />
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <ul>
          {sorted.map((mem) => {
            const sources = mem.sourceEvidenceIds
              .map((id) => getEvidenceById(id)?.title)
              .filter(Boolean);
            return (
              <li
                key={mem.id}
                className="border-b border-border px-4 py-3.5 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={memoryStatusTone(mem.status)}>{mem.status}</Badge>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-muted-dim">
                    {mem.type}
                  </span>
                  {mem.requiresHumanInput ? (
                    <Badge tone="amber">Needs input</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-foreground">
                  {mem.statement}
                </p>
                <ConfidenceBar value={mem.confidence} className="mt-2.5" />
                <p className="mt-1.5 truncate text-[11px] text-muted">
                  {sources.join(" · ") || "—"}
                </p>
                {mem.proposed ? (
                  <div className="mt-2.5 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="pressable"
                      onClick={() => approveMemory(mem.id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMemory(mem.id)}
                    >
                      Dispute
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
