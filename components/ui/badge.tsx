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
  neutral: "bg-white/5 text-muted border-border",
  lime: "bg-lime-soft text-lime border-lime/25",
  purple: "bg-purple-soft text-purple border-purple/25",
  amber: "bg-amber-soft text-amber border-amber/25",
  red: "bg-red-soft text-red border-red/25",
  green: "bg-green-soft text-green border-green/25",
  blue: "bg-blue-soft text-blue border-blue/25",
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
      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
      tones[tone],
      className,
    )}
  >
    {icon}
    {children}
  </span>
);
