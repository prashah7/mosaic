"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";

export default function OnboardingPage() {
  const router = useRouter();
  const { workspaceName, companyName, role, setField, complete, markProgress } =
    useOnboarding();
  const [isAdvancing, setIsAdvancing] = useState(false);

  const canContinue =
    workspaceName.trim().length >= 3 &&
    companyName.trim().length >= 2 &&
    role.trim().length >= 2;

  const handleContinue = async () => {
    if (!canContinue) return;
    setIsAdvancing(true);
    await new Promise((r) => setTimeout(r, 280));
    complete();
    markProgress("entered");
    router.push("/demo");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <div className="stagger space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
              Optional setup
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Name your workspace
            </h1>
            <p className="mt-2 text-sm text-muted">
              Prototype only — you’ll still explore the seeded Enterprise SSO
              initiative next.
            </p>
          </div>
          <Badge tone="purple">Local only</Badge>
        </div>

        <Panel className="slide-in-right space-y-4 p-5">
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Workspace name</span>
            <input
              className="input-glow h-10 w-full rounded-md border border-border bg-surface-overlay px-3 text-sm outline-none"
              value={workspaceName}
              onChange={(e) => setField("workspaceName", e.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Company</span>
            <input
              className="input-glow h-10 w-full rounded-md border border-border bg-surface-overlay px-3 text-sm outline-none"
              value={companyName}
              onChange={(e) => setField("companyName", e.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Your role</span>
            <input
              className="input-glow h-10 w-full rounded-md border border-border bg-surface-overlay px-3 text-sm outline-none"
              value={role}
              onChange={(e) => setField("role", e.target.value)}
            />
          </label>
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/initiatives/${SEED_INITIATIVE_ID}`}
            className="text-[13px] text-muted hover:text-foreground"
            onClick={() => markProgress("entered")}
          >
            Skip to seeded demo
          </Link>
          <Button
            variant="primary"
            rightIcon={
              isAdvancing ? undefined : <ArrowRight className="size-4" />
            }
            leftIcon={isAdvancing ? <Sparkles className="size-3.5" /> : undefined}
            disabled={!canContinue || isAdvancing}
            onClick={handleContinue}
            className="pressable"
          >
            {isAdvancing ? "Opening demo…" : "Continue to orientation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
