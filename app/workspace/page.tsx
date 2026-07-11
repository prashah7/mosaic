"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { AuthFlowShell, AuthFlowSkip } from "@/components/auth-flow-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";

export default function WorkspacePage() {
  const router = useRouter();
  const { workspaceName, companyName, setField, markProgress, complete } =
    useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canContinue =
    workspaceName.trim().length >= 3 && companyName.trim().length >= 2;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!canContinue) {
      setError("Enter a workspace name (3+) and company (2+ characters).");
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 280));
    setIsSubmitting(false);
    router.push("/onboarding/role");
  };

  return (
    <AuthFlowShell
      step="workspace"
      title="Name your workspace"
      description="Where Luci will keep initiatives, memory, and follow-ups for your team."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AuthFlowSkip
            href={`/initiatives/${SEED_INITIATIVE_ID}`}
            onClick={() => {
              complete();
              markProgress("entered");
            }}
          />
        </div>
      }
    >
      <Panel className="p-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Workspace name</span>
            <input
              className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
              value={workspaceName}
              onChange={(e) => setField("workspaceName", e.target.value)}
              placeholder="e.g. Northline Platform"
              autoComplete="organization"
            />
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Company</span>
            <input
              className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
              value={companyName}
              onChange={(e) => setField("companyName", e.target.value)}
              placeholder="e.g. Northline Software"
              autoComplete="organization"
            />
          </label>
          {error ? (
            <p className="shake text-xs text-red" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            rightIcon={
              isSubmitting ? undefined : <ArrowRight className="size-4" />
            }
            disabled={!canContinue || isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Continue"}
          </Button>
        </form>
      </Panel>
    </AuthFlowShell>
  );
}
