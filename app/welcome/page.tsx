"use client";

import Link from "next/link";
import { ArrowRight, Brain, Columns3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MosaicLogo } from "@/components/mosaic-logo";
import { useOnboarding } from "@/components/onboarding-provider";

const pillars = [
  {
    icon: Sparkles,
    title: "Ask Luci before and after meetings",
    body: "Pre-meeting briefs and post-meeting synthesis with citations — not another audit scorecard.",
  },
  {
    icon: Brain,
    title: "Durable memory with provenance",
    body: "Confirm decisions and risks once. Later runs retrieve them with source evidence.",
  },
  {
    icon: Columns3,
    title: "Follow-ups on a Kanban board",
    body: "Approve proposed actions in one review moment. Missing owners stay unassigned.",
  },
];

export default function WelcomePage() {
  const { markProgress } = useOnboarding();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="stagger grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <MosaicLogo size="hero" priority className="float-soft" />
          <h1 className="text-[40px] font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-5xl">
            Mosaic
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted">
            What do you need to know before this meeting — and what should happen
            next? Luci prepares briefs, synthesizes meetings, updates memory, and
            proposes follow-ups you approve once.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/demo"
              onClick={() => markProgress("entered")}
            >
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="size-4" />}
                className="pressable"
              >
                Enter demo
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="pressable">
                Create account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="panel float-soft relative overflow-hidden p-5">
          <div className="dot-grid absolute inset-0 opacity-60" />
          <div className="relative space-y-3">
            {[
              "Enter as seeded PM on Enterprise SSO",
              "Ask Luci for a pre-meeting brief",
              "Run post-meeting synthesis + mind map",
              "Approve memory and Kanban in one review",
            ].map((step) => (
              <div
                key={step}
                className="hover-lift flex items-center gap-3 rounded-lg border border-border bg-surface-raised/90 px-3 py-3"
              >
                <Sparkles className="size-3.5 shrink-0 text-accent" />
                <span className="text-sm text-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article
              key={pillar.title}
              className="panel hover-lift space-y-3 p-5"
            >
              <div className="inline-flex rounded-md border border-border bg-black/20 p-2">
                <Icon className="size-4 text-accent" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                {pillar.title}
              </h2>
              <p className="text-xs leading-relaxed text-muted">{pillar.body}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
