"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowUp,
  Brain,
  ChevronDown,
  ChevronUp,
  Columns3,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MosaicLogo } from "@/components/mosaic-logo";
import {
  getEvidenceForInitiative,
  getRunsForInitiative,
  runs as allRuns,
} from "@/lib/mosaic-data";
import type { EvidenceSource, Initiative, Run, RunType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Same jobs as the old form — mapped into chat starters + mode chips */
const runTypes: Array<{
  id: RunType;
  label: string;
  hint: string;
  prompt: string;
}> = [
  {
    id: "PRE_MEETING",
    label: "Pre-meeting",
    hint: "Brief + agenda before a sync",
    prompt:
      "Prepare me for the July 8 architecture planning meeting with eng, infra, legal, and CS.",
  },
  {
    id: "POST_MEETING",
    label: "Post-meeting",
    hint: "Synthesis, memory, follow-ups",
    prompt:
      "Synthesize the July 8 architecture meeting and update initiative memory and follow-ups.",
  },
  {
    id: "WEEKLY_REVIEW",
    label: "Weekly review",
    hint: "Progress vs goal",
    prompt:
      "Weekly review: what moved on Enterprise SSO, what is blocked, and what needs a decision.",
  },
  {
    id: "GENERAL_SYNTHESIS",
    label: "General",
    hint: "Open-ended synthesis",
    prompt:
      "Synthesize current evidence into an initiative status update with citations.",
  },
];

const seedEvidenceByType: Record<RunType, string[]> = {
  PRE_MEETING: ["src_rr", "src_prd", "src_prior", "src_tickets"],
  POST_MEETING: ["src_transcript", "src_prd", "src_tickets", "src_slack"],
  WEEKLY_REVIEW: ["src_prd", "src_tickets", "src_slack", "src_transcript"],
  GENERAL_SYNTHESIS: ["src_prd", "src_transcript", "src_prior"],
};

type ChatMessage =
  | {
      id: string;
      role: "user";
      content: string;
      runType?: RunType;
      evidenceIds?: string[];
    }
  | {
      id: string;
      role: "luci";
      content: string;
      run?: Run;
      pending?: boolean;
    };

const resolveRunId = (
  initiativeId: string,
  runType: RunType,
): string | undefined => {
  const match = allRuns.find(
    (r) => r.initiativeId === initiativeId && r.type === runType,
  );
  return match?.id ?? allRuns.find((r) => r.initiativeId === initiativeId)?.id;
};

export const AskLuciChat = ({ initiative }: { initiative: Initiative }) => (
  <Suspense
    fallback={<div className="p-6 text-sm text-muted">Loading Luci…</div>}
  >
    <AskLuciChatInner initiative={initiative} />
  </Suspense>
);

const AskLuciChatInner = ({ initiative }: { initiative: Initiative }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const evidence = getEvidenceForInitiative(initiative.id);
  const priorRuns = getRunsForInitiative(initiative.id).sort((a, b) =>
    (a.completedAt ?? a.createdAt).localeCompare(b.completedAt ?? b.createdAt),
  );

  const historyMessages = useMemo((): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    for (const run of priorRuns) {
      messages.push({
        id: `u-${run.id}`,
        role: "user",
        content: run.instruction,
        runType: run.type,
        evidenceIds: run.evidenceSourceIds,
      });
      messages.push({
        id: `l-${run.id}`,
        role: "luci",
        content: run.opinion ?? "Result ready.",
        run,
      });
    }
    return messages;
  }, [priorRuns]);

  const typeParam = searchParams.get("type") as RunType | null;
  const validInitial = runTypes.some((t) => t.id === typeParam)
    ? (typeParam as RunType)
    : "PRE_MEETING";

  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState(
    () => runTypes.find((t) => t.id === validInitial)?.prompt ?? "",
  );
  const [runType, setRunType] = useState<RunType>(validInitial);
  const [selected, setSelected] = useState<string[]>(
    seedEvidenceByType[validInitial],
  );
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type") as RunType | null;
    if (!type || !runTypes.some((t) => t.id === type)) return;
    setRunType(type);
    setSelected(seedEvidenceByType[type]);
    setDraft(runTypes.find((t) => t.id === type)?.prompt ?? "");
    textareaRef.current?.focus();
  }, [searchParams]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [liveMessages, isPending, showHistory]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const activeType = runTypes.find((t) => t.id === runType)!;
  const selectedSources = evidence.filter((e) => selected.includes(e.id));

  const applyType = (next: RunType) => {
    setRunType(next);
    setSelected(seedEvidenceByType[next]);
    setDraft(runTypes.find((t) => t.id === next)?.prompt ?? "");
    setShowAllEvidence(false);
    textareaRef.current?.focus();
  };

  const toggleEvidence = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isPending || selected.length === 0) return;

    const runId = resolveRunId(initiative.id, runType);
    if (!runId) return;

    setLiveMessages((prev) => [
      ...prev,
      {
        id: `u-live-${Date.now()}`,
        role: "user",
        content,
        runType,
        evidenceIds: selected,
      },
      {
        id: `l-live-${Date.now()}`,
        role: "luci",
        content: "Working — opening live run…",
        pending: true,
      },
    ]);
    setDraft("");

    startTransition(() => {
      router.push(`/initiatives/${initiative.id}/runs/${runId}?live=1`);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const hasLive = liveMessages.length > 0;

  return (
    <div className="flex h-[calc(100dvh-2.75rem)] flex-col bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-4 pt-5 sm:px-6">
          {/* Product context — one line, not a form header */}
          <p className="mb-4 text-[12px] text-muted">
            <Link
              href={`/initiatives/${initiative.id}`}
              className="text-foreground hover:underline"
            >
              {initiative.name}
            </Link>
            <span className="text-muted-dim"> · Ask Luci</span>
          </p>

          {historyMessages.length > 0 ? (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-left focus-ring"
              >
                <span className="text-[12px] text-muted">
                  Earlier on this initiative · {priorRuns.length} runs
                </span>
                {showHistory ? (
                  <ChevronUp className="size-3.5 text-muted" />
                ) : (
                  <ChevronDown className="size-3.5 text-muted" />
                )}
              </button>
              {showHistory ? (
                <div className="mt-4 space-y-6 border-l border-border pl-4">
                  {historyMessages.map((message) =>
                    message.role === "user" ? (
                      <UserBubble
                        key={message.id}
                        message={message}
                        evidence={evidence}
                      />
                    ) : (
                      <LuciBubble
                        key={message.id}
                        message={message}
                        initiativeId={initiative.id}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {!hasLive ? (
            <StarterGrid
              activeId={runType}
              onPick={applyType}
              initiativeName={initiative.name}
            />
          ) : (
            <div className="mb-4 space-y-6">
              {liveMessages.map((message) =>
                message.role === "user" ? (
                  <UserBubble
                    key={message.id}
                    message={message}
                    evidence={evidence}
                  />
                ) : (
                  <LuciBubble
                    key={message.id}
                    message={message}
                    initiativeId={initiative.id}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer = Intent + mode + attached evidence (form fields, chat shape) */}
      <div className="shrink-0 border-t border-border bg-[#0f0f10]/95 backdrop-blur-md">
        <form
          onSubmit={submit}
          className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-6 sm:py-4"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised focus-within:border-accent/40">
            {/* Attached evidence — always visible like ChatGPT attachments */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border/80 px-3 py-2">
              <span className="mr-1 text-[10px] uppercase tracking-[0.1em] text-muted-dim">
                Using
              </span>
              {selectedSources.map((src) => (
                <span
                  key={src.id}
                  className="inline-flex max-w-[160px] items-center gap-1 rounded-md border border-accent/25 bg-accent-soft px-2 py-0.5 text-[11px] text-foreground"
                >
                  <FileText className="size-3 shrink-0 text-accent" />
                  <span className="truncate">{src.title}</span>
                  <button
                    type="button"
                    onClick={() => toggleEvidence(src.id)}
                    className="rounded p-0.5 text-muted hover:text-foreground focus-ring"
                    aria-label={`Remove ${src.title}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setShowAllEvidence((v) => !v)}
                className="rounded-md px-2 py-0.5 text-[11px] text-accent hover:bg-accent-soft focus-ring"
              >
                {showAllEvidence ? "Done" : "+ Sources"}
              </button>
            </div>

            {showAllEvidence ? (
              <div className="flex flex-wrap gap-1.5 border-b border-border/80 bg-surface px-3 py-2">
                {evidence.map((src) => (
                  <EvidenceChip
                    key={src.id}
                    source={src}
                    active={selected.includes(src.id)}
                    onToggle={() => toggleEvidence(src.id)}
                  />
                ))}
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="What do you need before or after the meeting?"
              className="max-h-40 min-h-[56px] w-full resize-none bg-transparent px-3.5 py-3 text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-dim"
            />

            <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
              <div className="flex flex-wrap gap-1">
                {runTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    title={type.hint}
                    onClick={() => applyType(type.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition focus-ring",
                      runType === type.id
                        ? "border-accent/40 bg-accent-soft text-[#c5caf5]"
                        : "border-border text-muted hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <p className="hidden text-[11px] text-muted-dim sm:block sm:flex-1">
                {activeType.hint}
              </p>
              <button
                type="submit"
                disabled={!draft.trim() || selected.length === 0 || isPending}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-medium text-white transition hover:bg-accent-hover disabled:opacity-40 pressable focus-ring"
              >
                {isPending ? "Starting…" : "Run"}
                <ArrowUp className="size-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const StarterGrid = ({
  activeId,
  onPick,
  initiativeName,
}: {
  activeId: RunType;
  onPick: (type: RunType) => void;
  initiativeName: string;
}) => (
  <div className="flex flex-1 flex-col justify-center gap-5 py-6">
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-black">
        <MosaicLogo size="sm" className="scale-125" />
      </div>
      <div>
        <p className="text-[14px] font-medium text-foreground">Luci</p>
        <p className="mt-1 max-w-lg text-[14px] leading-relaxed text-muted">
          What do you need for {initiativeName}? Pick a mode — I’ll fill intent
          and sources. Edit anything, then Run.
        </p>
      </div>
    </div>

    <div className="grid gap-2 sm:grid-cols-2">
      {runTypes.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onPick(type.id)}
          className={cn(
            "rounded-xl border px-3.5 py-3 text-left transition focus-ring",
            activeId === type.id
              ? "border-accent/40 bg-accent-soft"
              : "border-border bg-surface hover:bg-white/[0.03]",
          )}
        >
          <p className="text-[13px] font-medium text-foreground">{type.label}</p>
          <p className="mt-0.5 text-[11px] text-muted">{type.hint}</p>
        </button>
      ))}
    </div>
  </div>
);

const UserBubble = ({
  message,
  evidence,
}: {
  message: Extract<ChatMessage, { role: "user" }>;
  evidence: EvidenceSource[];
}) => {
  const attached = evidence.filter((e) =>
    message.evidenceIds?.includes(e.id),
  );
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] space-y-1.5">
        <div className="flex flex-wrap justify-end gap-1">
          {message.runType ? (
            <Badge tone="purple">
              {message.runType.replaceAll("_", " ")}
            </Badge>
          ) : null}
          {attached.slice(0, 2).map((src) => (
            <Badge key={src.id} tone="neutral">
              {src.title}
            </Badge>
          ))}
          {attached.length > 2 ? (
            <Badge tone="neutral">+{attached.length - 2}</Badge>
          ) : null}
        </div>
        <div className="rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 text-[14px] leading-relaxed text-foreground">
          {message.content}
        </div>
      </div>
    </div>
  );
};

const LuciBubble = ({
  message,
  initiativeId,
}: {
  message: Extract<ChatMessage, { role: "luci" }>;
  initiativeId: string;
}) => (
  <div className="flex gap-3">
    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-black">
      <MosaicLogo size="sm" className="scale-125" />
    </div>
    <div className="min-w-0 flex-1 space-y-3">
      <p className="text-[12px] font-medium text-foreground">Luci</p>
      <p
        className={cn(
          "text-[14px] leading-relaxed text-foreground/90",
          message.pending && "text-muted",
        )}
      >
        {message.content}
      </p>
      {message.run && !message.pending ? (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
          <div className="flex flex-wrap gap-1.5">
            {message.run.synthesis.slice(0, 4).map((block) => (
              <Badge key={block.id} tone="neutral">
                {block.kind}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={`/initiatives/${initiativeId}/runs/${message.run.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-foreground hover:bg-white/[0.04] focus-ring"
            >
              <Sparkles className="size-3 text-accent" />
              Open result
            </Link>
            {message.run.type === "POST_MEETING" ? (
              <>
                <Link
                  href={`/initiatives/${initiativeId}/board`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-foreground hover:bg-white/[0.04] focus-ring"
                >
                  <Columns3 className="size-3 text-accent" />
                  Board
                </Link>
                <Link
                  href={`/initiatives/${initiativeId}/memory`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] text-foreground hover:bg-white/[0.04] focus-ring"
                >
                  <Brain className="size-3 text-accent" />
                  Memory
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  </div>
);

const EvidenceChip = ({
  source,
  active,
  onToggle,
}: {
  source: EvidenceSource;
  active: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={cn(
      "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition focus-ring",
      active
        ? "border-accent/35 bg-accent-soft text-foreground"
        : "border-border text-muted hover:text-foreground",
    )}
  >
    <FileText className="size-3 shrink-0" />
    <span className="truncate">{source.title}</span>
  </button>
);
