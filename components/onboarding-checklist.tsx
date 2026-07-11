"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { RingProgress } from "@/components/ui/dataviz";
import { useOnboarding } from "@/components/onboarding-provider";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";
import { cn } from "@/lib/utils";

export const OnboardingChecklist = () => {
  const {
    hydrated,
    dismissedChecklist,
    dismissChecklist,
    reset,
    progress,
    nextAction,
  } = useOnboarding();

  if (!hydrated || dismissedChecklist) return null;

  const items = [
    {
      done: progress.saw_pre,
      label: "Pre-meeting brief",
      href: `/initiatives/${SEED_INITIATIVE_ID}/ask?type=PRE_MEETING`,
    },
    {
      done: progress.reviewed_post,
      label: "Post-meeting synthesis",
      href: `/initiatives/${SEED_INITIATIVE_ID}/ask?type=POST_MEETING`,
    },
    {
      done: progress.approved_actions,
      label: "Approve follow-ups",
      href: `/initiatives/${SEED_INITIATIVE_ID}/runs/run_post_1`,
    },
    {
      done: progress.checked_memory,
      label: "Check memory",
      href: `/initiatives/${SEED_INITIATIVE_ID}/memory`,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;

  return (
    <Panel className="hover-lift overflow-hidden border-accent/30">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <RingProgress
          value={doneCount / items.length}
          size={44}
          stroke={4}
          label={`${doneCount}/${items.length}`}
          sublabel="Luci loop"
        />
        <div className="flex items-center gap-2">
          <Link href={nextAction.href}>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Sparkles className="size-3.5" />}
              className="pressable"
            >
              {nextAction.label}
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={reset}>
            Reset
          </Button>
          <button
            type="button"
            onClick={dismissChecklist}
            className="rounded-md p-1 text-muted hover:bg-white/5 focus-ring"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <ul className="grid gap-0 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="border-b border-border sm:odd:border-r">
            <Link
              href={item.href}
              className="linear-row flex items-center gap-2.5 px-4 py-2.5 text-[13px] focus-ring"
            >
              {item.done ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-green" />
              ) : (
                <Circle className="size-3.5 shrink-0 text-muted-dim" />
              )}
              <span
                className={cn(
                  item.done ? "text-muted line-through" : "text-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
};
