"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { EvidenceSource, EvidenceType } from "@/lib/types";
import { FileText, Plus } from "lucide-react";

const typeTone = (
  type: EvidenceType,
): "purple" | "blue" | "lime" | "amber" | "neutral" => {
  if (type === "PRD") return "purple";
  if (type === "MEETING_TRANSCRIPT") return "blue";
  if (type === "TICKET_LIST") return "lime";
  if (type === "SLACK_DISCUSSION") return "amber";
  return "neutral";
};

export const EvidencePanel = ({
  initialEvidence,
}: {
  initialEvidence: EvidenceSource[];
}) => {
  const [items, setItems] = useState(initialEvidence);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<EvidenceType>("MEETING_TRANSCRIPT");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedId, setSelectedId] = useState(initialEvidence[0]?.id);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? items[0],
    [items, selectedId],
  );

  const handleAdd = () => {
    if (title.trim().length < 3 || content.trim().length < 20) return;
    const next: EvidenceSource = {
      id: `src_local_${Date.now()}`,
      initiativeId: items[0]?.initiativeId ?? "init_sso",
      type,
      title: title.trim(),
      content: content.trim(),
      wordCount: content.trim().split(/\s+/).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [next, ...prev]);
    setSelectedId(next.id);
    setTitle("");
    setContent("");
    setIsAdding(false);
  };

  return (
    <Panel>
      <PanelHeader
        title="Evidence inventory"
        description="Historical snapshots stay immutable per run. New evidence can be added for later runs."
        action={
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => setIsAdding((v) => !v)}
          >
            Add evidence
          </Button>
        }
      />
      <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <ul className="max-h-72 overflow-y-auto scrollbar-thin">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition hover:bg-white/5 focus-ring ${
                    selected?.id === item.id ? "bg-white/5" : ""
                  }`}
                >
                  <Badge tone={typeTone(item.type)} className="w-fit">
                    {item.type.replaceAll("_", " ")}
                  </Badge>
                  <span className="truncate text-xs font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-muted">
                    {item.wordCount} words
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          {isAdding ? (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-black/20 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs">
                  <span className="text-muted-dim">Title</span>
                  <input
                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-lime/40"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-muted-dim">Type</span>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-lime/40"
                    value={type}
                    onChange={(e) => setType(e.target.value as EvidenceType)}
                  >
                    <option value="MEETING_TRANSCRIPT">Meeting transcript</option>
                    <option value="SLACK_DISCUSSION">Slack discussion</option>
                    <option value="PRD">PRD</option>
                    <option value="TICKET_LIST">Ticket list</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-1 text-xs">
                <span className="text-muted-dim">Content</span>
                <textarea
                  className="min-h-[100px] w-full rounded-lg border border-border bg-surface p-3 text-sm outline-none focus:border-lime/40"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste transcript, Slack thread, or notes…"
                />
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handleAdd}>
                  Save evidence
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-purple" />
                <h3 className="text-sm font-semibold">{selected.title}</h3>
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-black/30 p-4 font-mono text-xs leading-relaxed text-muted scrollbar-thin">
                {selected.content}
              </pre>
            </>
          ) : (
            <p className="text-sm text-muted">No evidence yet.</p>
          )}
        </div>
      </div>
    </Panel>
  );
};
