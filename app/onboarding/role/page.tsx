"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { AuthFlowShell, AuthFlowSkip } from "@/components/auth-flow-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";
import { cn } from "@/lib/utils";

const PRESET_ROLES = [
  "Product Manager",
  "Engineering Lead",
  "Founder",
] as const;

type PresetRole = (typeof PRESET_ROLES)[number];

const isPresetRole = (value: string): value is PresetRole =>
  (PRESET_ROLES as readonly string[]).includes(value);

export default function OnboardingRolePage() {
  const router = useRouter();
  const { role, setField, markProgress, complete } = useOnboarding();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isOther, setIsOther] = useState(!isPresetRole(role));
  const [customRole, setCustomRole] = useState(
    isPresetRole(role) ? "" : role === "Other" ? "" : role,
  );

  const effectiveRole = isOther ? customRole.trim() : role;
  const canContinue = effectiveRole.length >= 2;

  const handleSelectPreset = (option: PresetRole) => {
    setIsOther(false);
    setField("role", option);
  };

  const handleSelectOther = () => {
    setIsOther(true);
    setField("role", customRole.trim() || "Other");
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    if (isOther) setField("role", customRole.trim());
    setIsAdvancing(true);
    await new Promise((r) => setTimeout(r, 220));
    setIsAdvancing(false);
    router.push("/onboarding/ready");
  };

  return (
    <AuthFlowShell
      step="role"
      title="What’s your role?"
      description="Luci tunes briefs and follow-ups to how you work."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AuthFlowSkip
            href={`/initiatives/${SEED_INITIATIVE_ID}`}
            onClick={() => {
              complete();
              markProgress("entered");
            }}
          />
          <Button
            variant="primary"
            rightIcon={
              isAdvancing ? undefined : <ArrowRight className="size-4" />
            }
            disabled={!canContinue || isAdvancing}
            onClick={handleContinue}
          >
            {isAdvancing ? "Saving…" : "Continue"}
          </Button>
        </div>
      }
    >
      <Panel className="overflow-hidden p-0">
        <ul className="divide-y divide-border">
          {PRESET_ROLES.map((option) => {
            const isSelected = !isOther && role === option;
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(option)}
                  className={cn(
                    "linear-row flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[13px] focus-ring",
                    isSelected ? "bg-white/[0.04] text-foreground" : "text-muted",
                  )}
                >
                  <span className="font-medium">{option}</span>
                  {isSelected ? (
                    <Check className="size-4 shrink-0 text-accent check-pop" />
                  ) : null}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={handleSelectOther}
              className={cn(
                "linear-row flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[13px] focus-ring",
                isOther ? "bg-white/[0.04] text-foreground" : "text-muted",
              )}
            >
              <span className="font-medium">Other</span>
              {isOther ? (
                <Check className="size-4 shrink-0 text-accent check-pop" />
              ) : null}
            </button>
          </li>
        </ul>
        {isOther ? (
          <div className="border-t border-border px-4 py-3">
            <label className="block space-y-1.5 text-xs">
              <span className="text-muted">Describe your role</span>
              <input
                className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
                value={customRole}
                onChange={(e) => {
                  setCustomRole(e.target.value);
                  setField("role", e.target.value || "Other");
                }}
                placeholder="e.g. Customer Success Lead"
                autoFocus
              />
            </label>
          </div>
        ) : null}
      </Panel>
    </AuthFlowShell>
  );
}
