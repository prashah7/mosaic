"use client";

import { use } from "react";
import Link from "next/link";
import { useReviewStore } from "@/components/review-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="stagger mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Board"
        description={`Follow-ups for ${initiative.name}. Approve from a run review, then move cards here.`}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {columns.map((column) => {
          const cards = actions.filter((a) => a.column === column);
          return (
            <Panel key={column} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <p className="text-[12px] font-medium text-foreground">
                  {columnLabel(column)}
                </p>
                <span className="text-[11px] text-muted-dim">{cards.length}</span>
              </div>
              <ul className="min-h-[200px] space-y-2 p-2.5">
                {cards.length === 0 ? (
                  <li className="px-2 py-6 text-center text-[12px] text-muted">
                    No cards
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
                        >
                          {card.approvalStatus === "PROPOSED"
                            ? "Proposed"
                            : card.approvalStatus}
                        </Badge>
                        {!card.ownerName ? (
                          <Badge tone="amber">
                            Human assignment required
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[13px] font-medium text-foreground">
                        {card.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        {card.description}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-dim">
                        {card.ownerName ?? "No owner"}
                        {card.deadline ? ` · Due ${card.deadline}` : ""}
                      </p>
                      {card.citations[0] ? (
                        <p className="mt-1.5 text-[11px] text-accent">
                          ← {card.citations[0].sourceTitle}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {card.approvalStatus === "PROPOSED" ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => approveAction(card.id)}
                          >
                            Approve
                          </Button>
                        ) : null}
                        {!card.ownerName ? (
                          <Button
                            size="sm"
                            variant="outline"
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

      <p className="text-[12px] text-muted">
        Prefer reviewing proposals from a{" "}
        <Link
          href={`/initiatives/${initiativeId}/runs/run_post_1`}
          className="text-accent hover:underline"
        >
          post-meeting run
        </Link>
        .
      </p>
    </div>
  );
}
