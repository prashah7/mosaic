"use client";

import { use } from "react";
import Link from "next/link";
import { useReviewStore } from "@/components/review-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MiniBars, RingProgress, SegmentBar } from "@/components/ui/dataviz";
import { Panel, PageHeader } from "@/components/ui/panel";
import { columnLabel } from "@/components/ui/status";
import { getInitiative } from "@/lib/mosaic-data";
import type { KanbanColumn } from "@/lib/types";
import { cn } from "@/lib/utils";

const columns: KanbanColumn[] = ["TODO", "DOING", "DONE"];

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default function BoardPage({ params }: PageProps) {
  const { initiativeId } = use(params);
  const initiative = getInitiative(initiativeId);
  const { actions, moveAction, approveAction, setActionOwner } =
    useReviewStore();

  if (!initiative) {
    return <p className="text-sm text-muted">Initiative not found.</p>;
  }

  const counts = {
    TODO: actions.filter((a) => a.column === "TODO").length,
    DOING: actions.filter((a) => a.column === "DOING").length,
    DONE: actions.filter((a) => a.column === "DONE").length,
  };
  const approved = actions.filter((a) => a.approvalStatus === "APPROVED").length;
  const needsOwner = actions.filter((a) => !a.ownerName).length;
  const doneRate = actions.length ? counts.DONE / actions.length : 0;

  return (
    <div className="stagger mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Board"
        description={initiative.name}
        action={
          <Link href={`/initiatives/${initiativeId}/runs/run_post_1`}>
            <Button size="sm" variant="outline">
              From last run
            </Button>
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4">
          <RingProgress
            value={doneRate}
            tone="green"
            label={`${Math.round(doneRate * 100)}%`}
            sublabel="Done"
          />
        </Panel>
        <Panel className="p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-muted-dim">
            Flow
          </p>
          <SegmentBar
            segments={[
              { value: counts.TODO, tone: "var(--amber)", label: "Todo" },
              { value: counts.DOING, tone: "var(--accent)", label: "Doing" },
              { value: counts.DONE, tone: "var(--green)", label: "Done" },
            ]}
          />
        </Panel>
        <Panel className="p-4">
          <MiniBars
            values={[
              { label: "Approved", value: approved },
              { label: "Open", value: actions.length - approved },
              { label: "No owner", value: needsOwner },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {columns.map((column) => {
          const cards = actions.filter((a) => a.column === column);
          return (
            <Panel key={column} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <p className="text-[12px] font-medium text-foreground">
                  {columnLabel(column)}
                </p>
                <span className="font-mono text-[11px] text-muted-dim">
                  {cards.length}
                </span>
              </div>
              <ul className="min-h-[160px] space-y-2 p-2.5">
                {cards.length === 0 ? (
                  <li className="px-2 py-6 text-center text-[12px] text-muted">
                    —
                  </li>
                ) : (
                  cards.map((card) => (
                    <li
                      key={card.id}
                      className={cn(
                        "rounded-md border border-border bg-surface-raised p-3",
                        !card.ownerName && "border-amber/30",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          tone={
                            card.approvalStatus === "APPROVED"
                              ? "green"
                              : card.approvalStatus === "REJECTED"
                                ? "red"
                                : "blue"
                          }
                          className={
                            card.approvalStatus === "APPROVED"
                              ? "check-pop"
                              : undefined
                          }
                        >
                          {card.approvalStatus === "PROPOSED"
                            ? "Proposed"
                            : card.approvalStatus}
                        </Badge>
                        {!card.ownerName ? (
                          <Badge tone="amber">Needs owner</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[13px] font-medium text-foreground">
                        {card.title}
                      </p>
                      <p className="mt-1.5 text-[11px] text-muted-dim">
                        {card.ownerName ?? "Unassigned"}
                        {card.deadline ? ` · ${card.deadline}` : ""}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {card.approvalStatus === "PROPOSED" ? (
                          <Button
                            size="sm"
                            variant="primary"
                            className="pressable"
                            onClick={() => approveAction(card.id)}
                          >
                            Approve
                          </Button>
                        ) : null}
                        {!card.ownerName ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="pressable"
                            onClick={() =>
                              setActionOwner(card.id, "Sambit Nayak")
                            }
                          >
                            Assign me
                          </Button>
                        ) : null}
                        {columns
                          .filter((c) => c !== column)
                          .map((c) => (
                            <Button
                              key={c}
                              size="sm"
                              variant="ghost"
                              className="pressable"
                              onClick={() => moveAction(card.id, c)}
                            >
                              → {columnLabel(c)}
                            </Button>
                          ))}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
