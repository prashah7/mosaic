import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AuthFlowStep = "account" | "workspace" | "role" | "ready";

const STEPS: { id: AuthFlowStep; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "workspace", label: "Workspace" },
  { id: "role", label: "Role" },
  { id: "ready", label: "Ready" },
];

const stepIndex = (step: AuthFlowStep): number =>
  STEPS.findIndex((s) => s.id === step);

type AuthFlowShellProps = {
  step: AuthFlowStep;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export const AuthFlowShell = ({
  step,
  title,
  description,
  children,
  footer,
  className,
}: AuthFlowShellProps) => {
  const current = stepIndex(step);

  return (
    <div
      className={cn(
        "mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6 sm:py-14",
        className,
      )}
    >
      <div className="page-enter space-y-6">
        <nav aria-label="Setup progress" className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const isActive = i === current;
            const isDone = i < current;
            return (
              <div key={s.id} className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div
                  className={cn(
                    "h-[3px] rounded-full transition-colors",
                    isActive || isDone ? "bg-accent" : "bg-border-strong",
                  )}
                />
                <span
                  className={cn(
                    "truncate text-[10px] font-medium uppercase tracking-[0.12em]",
                    isActive
                      ? "text-foreground"
                      : isDone
                        ? "text-muted"
                        : "text-muted-dim",
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </nav>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
            Step {current + 1} of {STEPS.length}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>

        {children}

        {footer ? <div className="pt-1">{footer}</div> : null}
      </div>
    </div>
  );
};

export const AuthFlowSkip = ({
  href,
  children = "Skip onboarding",
  onClick,
}: {
  href: string;
  children?: ReactNode;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="text-[13px] text-muted transition hover:text-foreground focus-ring rounded"
  >
    {children}
  </Link>
);
