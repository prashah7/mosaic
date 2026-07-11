import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Panel = ({
  children,
  className,
  raised = false,
}: {
  children: ReactNode;
  className?: string;
  raised?: boolean;
}) => (
  <div className={cn(raised ? "panel-raised" : "panel", className)}>
    {children}
  </div>
);

export const PanelHeader = ({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5",
      className,
    )}
  >
    <div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      ) : null}
    </div>
    {action}
  </div>
);
