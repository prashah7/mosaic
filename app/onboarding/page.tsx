"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  FolderKanban,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import {
  useOnboarding,
  type OnboardingStepId,
} from "@/components/onboarding-provider";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const steps: Array<{
  id: OnboardingStepId;
  label: string;
  icon: typeof Users;
}> = [
  { id: "workspace", label: "Workspace", icon: Users },
  { id: "initiative", label: "Initiative", icon: FolderKanban },
  { id: "evidence", label: "Evidence", icon: FileText },
  { id: "first-run", label: "First run", icon: Sparkles },
];

export default function OnboardingPage() {
  const router = useRouter();
  const onboarding = useOnboarding();
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    if (!onboarding.hydrated) return;
    if (
      onboarding.currentStep === "welcome" ||
      onboarding.currentStep === "account"
    ) {
      onboarding.goTo("workspace");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync initial step once hydrated
  }, [onboarding.hydrated, onboarding.currentStep]);

  const stepIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === onboarding.currentStep),
  );
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const goNext = async () => {
    setDirection("forward");
    setIsAdvancing(true);
    await new Promise((r) => setTimeout(r, 220));
    if (onboarding.currentStep === "workspace") onboarding.goTo("initiative");
    else if (onboarding.currentStep === "initiative") onboarding.goTo("evidence");
    else if (onboarding.currentStep === "evidence") onboarding.goTo("first-run");
    else if (onboarding.currentStep === "first-run") {
      onboarding.complete();
      router.push("/initiatives/init_sso/runs/run_sso_1");
      return;
    }
    setIsAdvancing(false);
  };

  const goBack = async () => {
    setDirection("back");
    setIsAdvancing(true);
    await new Promise((r) => setTimeout(r, 180));
    if (onboarding.currentStep === "initiative") onboarding.goTo("workspace");
    else if (onboarding.currentStep === "evidence") onboarding.goTo("initiative");
    else if (onboarding.currentStep === "first-run") onboarding.goTo("evidence");
    else router.push("/signup");
    setIsAdvancing(false);
  };

  const canContinue = () => {
    if (onboarding.currentStep === "workspace") {
      return (
        onboarding.workspaceName.trim().length >= 3 &&
        onboarding.companyName.trim().length >= 2
      );
    }
    if (onboarding.currentStep === "initiative") {
      return (
        onboarding.initiativeName.trim().length >= 3 &&
        onboarding.objective.trim().length >= 20 &&
        onboarding.successMetric.trim().length >= 5
      );
    }
    if (onboarding.currentStep === "evidence") {
      return (
        onboarding.evidenceTitle.trim().length >= 3 &&
        onboarding.evidenceContent.trim().length >= 40
      );
    }
    return onboarding.luciInstruction.trim().length >= 10;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
              Guided setup
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Get Mosaic ready for Luci
            </h1>
          </div>
          <Badge tone="purple">Prototype · local only</Badge>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="progress-fill h-full rounded-full bg-gradient-to-r from-accent/70 to-accent"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const done = index < stepIndex;
            const active = index === stepIndex;
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition",
                  active && "border-accent/40 bg-accent-soft text-accent",
                  done && "border-green/30 bg-green-soft text-green",
                  !active && !done && "border-border text-muted",
                )}
              >
                {done ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <Icon className="size-3.5 shrink-0" />
                )}
                {step.label}
              </li>
            );
          })}
        </ol>
      </div>

      <Panel
        className={cn(
          "p-5 sm:p-6",
          isAdvancing &&
            (direction === "forward" ? "slide-out-left" : "slide-out-right"),
          !isAdvancing &&
            (direction === "forward" ? "slide-in-right" : "slide-in-left"),
        )}
      >
        {onboarding.currentStep === "workspace" ? (
          <StepBlock
            title="Workspace profile"
            description="A private MVP workspace is created for you. Team invites come later."
          >
            <Field
              label="Workspace name"
              value={onboarding.workspaceName}
              onChange={(v) => onboarding.setField("workspaceName", v)}
            />
            <Field
              label="Company"
              value={onboarding.companyName}
              onChange={(v) => onboarding.setField("companyName", v)}
            />
            <Field
              label="Role"
              value={onboarding.role}
              onChange={(v) => onboarding.setField("role", v)}
            />
          </StepBlock>
        ) : null}

        {onboarding.currentStep === "initiative" ? (
          <StepBlock
            title="Create your first initiative"
            description="Required: name, objective, success metric, and product stage."
          >
            <Field
              label="Initiative name"
              value={onboarding.initiativeName}
              onChange={(v) => onboarding.setField("initiativeName", v)}
            />
            <Field
              label="Objective (20+ characters)"
              value={onboarding.objective}
              onChange={(v) => onboarding.setField("objective", v)}
              multiline
            />
            <Field
              label="Success metric"
              value={onboarding.successMetric}
              onChange={(v) => onboarding.setField("successMetric", v)}
            />
            <label className="block space-y-1.5 text-xs">
              <span className="text-muted">Product stage</span>
              <select
                className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
                value={onboarding.stage}
                onChange={(e) => onboarding.setField("stage", e.target.value)}
              >
                {[
                  "Discovery",
                  "Definition",
                  "Specification",
                  "Engineering readiness",
                  "Development",
                  "Launch readiness",
                  "Post launch",
                ].map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
          </StepBlock>
        ) : null}

        {onboarding.currentStep === "evidence" ? (
          <StepBlock
            title="Add initial evidence"
            description="A readiness audit needs a PRD, transcript, and tickets. Start with one source here."
          >
            <Field
              label="Evidence title"
              value={onboarding.evidenceTitle}
              onChange={(v) => onboarding.setField("evidenceTitle", v)}
            />
            <Field
              label="Paste transcript / PRD excerpt (40+ characters)"
              value={onboarding.evidenceContent}
              onChange={(v) => onboarding.setField("evidenceContent", v)}
              multiline
            />
            <p className="rounded-lg border border-border bg-black/20 px-3 py-2 text-[11px] text-muted">
              Demo tip: the seeded Enterprise SSO pack already includes PRD,
              transcript, and tickets after setup.
            </p>
          </StepBlock>
        ) : null}

        {onboarding.currentStep === "first-run" ||
        onboarding.currentStep === "complete" ? (
          <StepBlock
            title="Tell Luci what to do"
            description="Ask Luci for a brief or synthesis. You’ll approve memory and follow-ups in one review."
          >
            <Field
              label="Instruction for Luci"
              value={onboarding.luciInstruction}
              onChange={(v) => onboarding.setField("luciInstruction", v)}
              multiline
            />
            <div className="rounded-xl border border-accent/25 bg-accent-soft/40 p-4">
              <p className="text-xs font-medium text-accent">What happens next</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted">
                <li>Luci plans specialist agents</li>
                <li>Synthesis appears with evidence citations</li>
                <li>You approve remediations before GitHub simulation</li>
              </ul>
            </div>
          </StepBlock>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="size-3.5" />}
            onClick={goBack}
            className="pressable"
          >
            Back
          </Button>
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Button variant="outline" className="pressable">
                Skip to dashboard
              </Button>
            </Link>
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="size-3.5" />}
              onClick={goNext}
              disabled={!canContinue() || isAdvancing}
              className="pressable"
            >
              {onboarding.currentStep === "first-run"
                ? "Start Luci run"
                : "Continue"}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

const StepBlock = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) => (
  <label className="block space-y-1.5 text-xs">
    <span className="text-muted">{label}</span>
    {multiline ? (
      <textarea
        className="input-glow min-h-[110px] w-full rounded-lg border border-border bg-surface-overlay p-3 text-sm outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </label>
);
