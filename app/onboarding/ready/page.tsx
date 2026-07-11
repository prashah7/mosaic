"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, Sparkles, UserRound } from "lucide-react";
import { AuthFlowShell, AuthFlowSkip } from "@/components/auth-flow-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";

export default function OnboardingReadyPage() {
  const router = useRouter();
  const { workspaceName, companyName, role, complete, markProgress } =
    useOnboarding();
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleEnterDemo = async () => {
    setIsAdvancing(true);
    await new Promise((r) => setTimeout(r, 280));
    complete();
    markProgress("entered");
    setIsAdvancing(false);
    router.push("/demo");
  };

  return (
    <AuthFlowShell
      step="ready"
      title="You’re set"
      description="Next you’ll enter as the PM on the seeded Enterprise SSO initiative."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AuthFlowSkip
            href={`/initiatives/${SEED_INITIATIVE_ID}`}
            onClick={() => {
              complete();
              markProgress("entered");
            }}
          >
            Skip onboarding
          </AuthFlowSkip>
          <Button
            variant="primary"
            size="lg"
            rightIcon={
              isAdvancing ? undefined : <ArrowRight className="size-4" />
            }
            leftIcon={
              isAdvancing ? <Sparkles className="size-3.5" /> : undefined
            }
            disabled={isAdvancing}
            onClick={handleEnterDemo}
          >
            {isAdvancing ? "Opening…" : "Continue to orientation"}
          </Button>
        </div>
      }
    >
      <Panel className="space-y-0 overflow-hidden p-0">
        <div className="flex items-start gap-3 border-b border-border px-4 py-3.5">
          <Building2 className="mt-0.5 size-4 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-dim">
              Workspace
            </p>
            <p className="mt-0.5 truncate text-[14px] font-medium text-foreground">
              {workspaceName || "Your workspace"}
            </p>
            <p className="truncate text-[12px] text-muted">
              {companyName || "Your company"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3.5">
          <UserRound className="mt-0.5 size-4 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-dim">
              Your role
            </p>
            <p className="mt-0.5 truncate text-[14px] font-medium text-foreground">
              {role || "Product Manager"}
            </p>
          </div>
        </div>
      </Panel>

      <p className="text-center text-xs text-muted">
        Prefer the full tour later?{" "}
        <Link href="/welcome" className="text-accent hover:underline">
          Back to welcome
        </Link>
      </p>
    </AuthFlowShell>
  );
}
