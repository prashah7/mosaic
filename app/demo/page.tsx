"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Target, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";
import {
  SEED_INITIATIVE_ID,
  initiatives,
  pmProfile,
  workspace,
} from "@/lib/mosaic-data";

export default function DemoOrientationPage() {
  const { markProgress } = useOnboarding();
  const initiative = initiatives[0];

  useEffect(() => {
    markProgress("entered");
  }, [markProgress]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="stagger space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
            Orientation
          </p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-foreground">
            You’re the PM on {initiative.name}.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Seeded demo — explore Ask Luci, memory, and the board with real
            initiative context already loaded.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Panel className="float-soft space-y-3 p-5">
            <div className="flex items-center gap-2">
              <User className="size-4 text-accent" />
              <p className="text-[14px] font-medium text-foreground">
                {pmProfile.title}
              </p>
            </div>
            <ul className="space-y-1">
              {pmProfile.ownedAreas.map((item) => (
                <li key={item} className="text-[12px] text-muted">
                  · {item}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-dim">{workspace.companyName}</p>
          </Panel>

          <Panel className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-amber" />
              <p className="text-[14px] font-medium text-foreground">Goal</p>
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/90">
              {initiative.objective}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="amber">{initiative.health}</Badge>
              <Badge tone="neutral">{initiative.stage}</Badge>
            </div>
          </Panel>
        </div>

        <Link href={`/initiatives/${SEED_INITIATIVE_ID}`}>
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="size-4" />}
            className="pressable"
          >
            Continue
          </Button>
        </Link>
      </div>
    </div>
  );
}
