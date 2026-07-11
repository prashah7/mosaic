"use client";

import { use } from "react";
import Link from "next/link";
import { useReviewStore } from "@/components/review-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PageHeader } from "@/components/ui/panel";
import { memoryStatusTone } from "@/components/ui/status";
import {
  getEvidenceById,
  getInitiative,
  getRun,
} from "@/lib/mosaic-data";
import { formatRelativeTime } from "@/lib/utils";

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default function MemoryPage({ params }: PageProps) {
  const { initiativeId } = use(params);
  const initiative = getInitiative(initiativeId);
  const { memory, approveMemory, rejectMemory } = useReviewStore();

  if (!initiative) {
    return <p className="text-sm text-muted">Initiative not found.</p>;
  }

  const sorted = [...memory].sort((a, b) =>
    b.lastConfirmedAt.localeCompare(a.lastConfirmedAt),
  );

  return (
    <div className="stagger mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Memory"
        description="Durable M3 facts for this initiative — type, confidence, source, status."
      />

      <Panel className="overflow-hidden">
        <ul>
          {sorted.map((mem) => {
            const run = getRun(mem.sourceRunId);
            const sources = mem.sourceEvidenceIds
              .map((id) => getEvidenceById(id)?.title)
              .filter(Boolean);
            return (
              <li
                key={mem.id}
                className="border-b border-border px-4 py-4 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={memoryStatusTone(mem.status)}>{mem.status}</Badge>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-dim">
                    {mem.type}
                  </span>
                  <span className="text-[11px] text-muted">
                    {Math.round(mem.confidence * 100)}% confidence
                  </span>
                  {mem.requiresHumanInput ? (
                    <Badge tone="amber">Needs human input</Badge>
                  ) : null}
                  {mem.proposed ? <Badge tone="blue">Proposed</Badge> : null}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-foreground">
                  {mem.statement}
                </p>
                <p className="mt-2 text-[11px] text-muted">
                  Sources: {sources.join(" · ") || "—"}
                  {run
                    ? ` · From ${run.type.replaceAll("_", " ")}`
                    : ""}
                  {" · "}
                  {formatRelativeTime(mem.lastConfirmedAt)}
                </p>
                {mem.supersededBy ? (
                  <p className="mt-1 text-[11px] text-muted-dim">
                    Superseded by {mem.supersededBy}
                  </p>
                ) : null}
                {mem.proposed ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
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

      <p className="text-[12px] text-muted">
        Later runs retrieve confirmed memory with provenance — try the{" "}
        <Link
          href={`/initiatives/${initiativeId}/runs/run_post_1`}
          className="text-accent hover:underline"
        >
          post-meeting result
        </Link>
        .
      </p>
    </div>
  );
}
