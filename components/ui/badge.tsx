import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone =
  | "neutral"
  | "lime"
  | "purple"
  | "amber"
  | "red"
  | "green"
  | "blue";

const tones: Record<Tone, string> = {
  neutral: "bg-white/[0.04] text-muted border-border",
  lime: "bg-accent-soft text-accent border-accent/25",
  purple: "bg-accent-soft text-accent border-accent/25",
  amber: "bg-amber-soft text-amber border-amber/20",
  red: "bg-red-soft text-red border-red/20",
  green: "bg-green-soft text-green border-green/20",
  blue: "bg-blue-soft text-blue border-blue/20",
};

export const Badge = ({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-[-0.01em]",
      tones[tone],
      className,
    )}
  >
    {icon}
    {children}
  </span>
);
