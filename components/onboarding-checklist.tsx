"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Rocket, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";

export const OnboardingChecklist = () => {
  const { hydrated, completed, dismissedChecklist, dismissChecklist, reset } =
    useOnboarding();

  if (!hydrated || dismissedChecklist) return null;

  const items = [
    {
      done: completed,
      label: "Finish guided setup",
      href: "/onboarding",
    },
    {
      done: completed,
      label: "Open Enterprise SSO initiative",
      href: `/initiatives/${SEED_INITIATIVE_ID}`,
    },
    {
      done: false,
      label: "Ask Luci, then approve memory & Kanban",
      href: `/initiatives/${SEED_INITIATIVE_ID}/runs/run_post_1`,
    },
  ];

  return (
    <Panel className="relative overflow-hidden border-accent/30 bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="rounded-md border border-accent/30 bg-accent-soft p-2">
            <Rocket className="size-4 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {completed ? "Finish the Luci loop" : "Complete your onboarding"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Ask Luci → synthesis with citations → one review moment
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissChecklist}
          className="rounded-md p-1 text-muted transition hover:bg-white/5 hover:text-foreground focus-ring"
          aria-label="Dismiss checklist"
        >
          <X className="size-4" />
        </button>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="linear-row flex items-center gap-3 px-4 py-3 text-[13px] focus-ring sm:px-5"
            >
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-green" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-dim" />
              )}
              <span
                className={
                  item.done ? "text-muted line-through" : "text-foreground"
                }
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 sm:px-5">
        <Link href={`/initiatives/${SEED_INITIATIVE_ID}/ask`}>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Sparkles className="size-3.5" />}
          >
            Ask Luci
          </Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={reset}>
          Reset demo
        </Button>
      </div>
    </Panel>
  );
};
