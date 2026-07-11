import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover font-medium shadow-[0_0_0_1px_rgba(94,106,210,0.35)]",
  secondary:
    "bg-surface-overlay text-foreground border border-border hover:border-border-strong hover:bg-[#242428]",
  ghost: "bg-transparent text-muted hover:text-foreground hover:bg-white/[0.04]",
  danger: "bg-red-soft text-red border border-red/20 hover:bg-red/15",
  outline:
    "bg-transparent text-foreground border border-border hover:bg-white/[0.03] hover:border-border-strong",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  lg: "h-9 px-3.5 text-sm gap-2 rounded-md",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export const Button = ({
  className,
  variant = "secondary",
  size = "md",
  leftIcon,
  rightIcon,
  children,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "inline-flex items-center justify-center transition-[colors,transform] duration-120 focus-ring disabled:opacity-40 disabled:pointer-events-none pressable",
      variants[variant],
      sizes[size],
      className,
    )}
    {...props}
  >
    {leftIcon}
    {children}
    {rightIcon}
  </button>
);
