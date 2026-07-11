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
  Columns3,
  FileText,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LuciAvatar } from "@/components/mosaic-logo";
import { api } from "@/lib/backend-client";
import type { EvidenceSource, Initiative, Run, RunType } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

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

  const [evidence, setEvidence] = useState<EvidenceSource[]>([]);
  const [priorRuns, setPriorRuns] = useState<Run[]>([]);

  useEffect(() => {
    Promise.all([api.sources(initiative.id), api.runs(initiative.id)]).then(
      ([nextEvidence, nextRuns]) => {
        setEvidence(nextEvidence);
        setPriorRuns(nextRuns);
        setSelected((current) => current.filter((id) => nextEvidence.some((source) => source.id === id)).length ? current : nextEvidence.map((source) => source.id));
      },
    );
  }, [initiative.id]);

  const typeParam = searchParams.get("type") as RunType | null;
  const validInitial = runTypes.some((t) => t.id === typeParam)
    ? (typeParam as RunType)
    : "PRE_MEETING";

  const [activeRunId, setActiveRunId] = useState<string | "new">("new");
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState(
    () => runTypes.find((t) => t.id === validInitial)?.prompt ?? "",
  );
  const [runType, setRunType] = useState<RunType>(validInitial);
  const [selected, setSelected] = useState<string[]>(
    seedEvidenceByType[validInitial],
  );
  const [showAllEvidence, setShowAllEvidence] = useState(false);

  const historyThread = useMemo((): ChatMessage[] => {
    if (activeRunId === "new") return [];
    const run = priorRuns.find((r) => r.id === activeRunId);
    if (!run) return [];
    return [
      {
        id: `u-${run.id}`,
        role: "user",
        content: run.instruction,
        runType: run.type,
        evidenceIds: run.evidenceSourceIds,
      },
      {
        id: `l-${run.id}`,
        role: "luci",
        content: run.opinion ?? "Result ready.",
        run,
      },
    ];
  }, [activeRunId, priorRuns]);

  const threadMessages =
    activeRunId === "new" ? liveMessages : [...historyThread, ...liveMessages];

  useEffect(() => {
    const type = searchParams.get("type") as RunType | null;
    if (!type || !runTypes.some((t) => t.id === type)) return;
    setActiveRunId("new");
    setLiveMessages([]);
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
  }, [threadMessages, isPending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const activeType = runTypes.find((t) => t.id === runType)!;
  const selectedSources = evidence.filter((e) => selected.includes(e.id));

  const startNewChat = () => {
    setActiveRunId("new");
    setLiveMessages([]);
    setRunType("PRE_MEETING");
    setSelected(seedEvidenceByType.PRE_MEETING);
    setDraft(runTypes[0].prompt);
    setShowAllEvidence(false);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const openHistory = (runId: string) => {
    const run = priorRuns.find((r) => r.id === runId);
    if (!run) return;
    setActiveRunId(runId);
    setLiveMessages([]);
    setRunType(run.type);
    setSelected(run.evidenceSourceIds);
    setDraft("");
  };

  const applyType = (next: RunType) => {
    setActiveRunId("new");
    setLiveMessages([]);
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

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isPending || selected.length === 0) return;

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

    try {
      const result = await api.createRun(initiative.id, { type: runType, intent: content, sourceIds: selected });
      startTransition(() => {
        router.push(`/initiatives/${initiative.id}/runs/${result.run.id}?live=1`);
      });
    } catch (cause) {
      setLiveMessages((prev) => prev.map((message) => message.role === "luci" && message.pending ? { ...message, pending: false, content: cause instanceof Error ? cause.message : "Luci could not start the run." } : message));
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const showStarters = activeRunId === "new" && liveMessages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-2.75rem)] bg-background">
      {/* Side chat history */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-[#0c0c0d] md:flex">
        <div className="border-b border-border px-3 py-3">
          <button
            type="button"
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[12px] font-medium text-[#0f0f10] transition hover:bg-accent-hover pressable focus-ring"
          >
            <Sparkles className="size-3.5" />
            New ask
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-dim">
            History
          </p>
          <button
            type="button"
            onClick={startNewChat}
            className={cn(
              "mb-1 flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition focus-ring",
              activeRunId === "new"
                ? "bg-accent-soft text-foreground"
                : "text-muted hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-medium">
                New conversation
              </span>
              <span className="block text-[10px] text-muted-dim">
                {initiative.name}
              </span>
            </span>
          </button>
          {priorRuns.map((run) => {
            const active = activeRunId === run.id;
            return (
              <button
                key={run.id}
                type="button"
                onClick={() => openHistory(run.id)}
                className={cn(
                  "mb-1 flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left transition focus-ring",
                  active
                    ? "bg-accent-soft text-foreground"
                    : "text-muted hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                <span className="truncate text-[12px] font-medium text-foreground">
                  {run.type.replaceAll("_", " ")}
                </span>
                <span className="line-clamp-2 text-[11px] leading-snug text-muted">
                  {run.instruction}
                </span>
                <span className="text-[10px] text-muted-dim">
                  {formatRelativeTime(run.completedAt ?? run.createdAt)}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-4 pt-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-2 md:hidden">
              <p className="text-[12px] text-muted">{initiative.name}</p>
              <button
                type="button"
                onClick={startNewChat}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground focus-ring"
              >
                New ask
              </button>
            </div>

            {/* Mobile history strip */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden scrollbar-thin">
              {priorRuns.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => openHistory(run.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[11px] focus-ring",
                    activeRunId === run.id
                      ? "border-accent/40 bg-accent-soft text-accent"
                      : "border-border text-muted",
                  )}
                >
                  {run.type.replaceAll("_", " ")}
                </button>
              ))}
            </div>

            {showStarters ? (
              <StarterGrid
                activeId={runType}
                onPick={applyType}
                initiativeName={initiative.name}
              />
            ) : (
              <div className="mb-4 space-y-6 page-enter">
                {threadMessages.map((message) =>
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

        <div className="shrink-0 border-t border-border bg-[#0f0f10]/95 backdrop-blur-md">
          <form
            onSubmit={submit}
            className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-6 sm:py-4"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised transition-[border-color] focus-within:border-accent/40">
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
                          ? "border-accent/40 bg-accent-soft text-accent"
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
                  className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-medium text-[#0f0f10] transition hover:bg-accent-hover disabled:opacity-40 pressable focus-ring"
                >
                  {isPending ? "Starting…" : "Run"}
                  <ArrowUp className="size-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
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
  <div className="flex flex-1 flex-col justify-center gap-5 py-6 page-enter">
    <div className="flex items-start gap-3">
      <LuciAvatar size="md" />
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
    <LuciAvatar className="mt-0.5" />
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
              href={`/initiatives/${initiativeId}/runs/${message.run.id}?live=0`}
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
