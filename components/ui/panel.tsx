import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export const Panel = ({
  children,
  className,
  raised = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  raised?: boolean;
} & HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(raised ? "panel-raised" : "panel", className)}
    {...props}
  >
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
      "flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3",
      className,
    )}
  >
    <div>
      <h2 className="text-[13px] font-medium tracking-[-0.01em] text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      ) : null}
    </div>
    {action}
  </div>
);

export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 text-[13px] text-muted">{description}</p>
      ) : null}
    </div>
    {action}
  </div>
);
