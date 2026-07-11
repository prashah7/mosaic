import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-lime text-black hover:bg-lime-dim font-semibold shadow-[0_0_0_1px_rgba(214,255,63,0.3)]",
  secondary:
    "bg-surface-overlay text-foreground border border-border hover:border-border-strong hover:bg-[#22232a]",
  ghost: "bg-transparent text-muted hover:text-foreground hover:bg-white/5",
  danger: "bg-red-soft text-red border border-red/30 hover:bg-red/20",
  outline:
    "bg-transparent text-foreground border border-border hover:border-lime/40 hover:text-lime",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
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
      "inline-flex items-center justify-center rounded-lg transition-colors focus-ring disabled:opacity-40 disabled:pointer-events-none",
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
