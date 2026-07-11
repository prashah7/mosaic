import { cn } from "@/lib/utils";

export const RingProgress = ({
  value,
  size = 56,
  stroke = 5,
  tone = "accent",
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "accent" | "green" | "amber" | "red" | "blue";
  label?: string;
  sublabel?: string;
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = c * (1 - clamped);
  const colors = {
    accent: "var(--accent)",
    green: "var(--green)",
    amber: "var(--amber)",
    red: "var(--red)",
    blue: "var(--blue)",
  };

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      {(label || sublabel) && (
        <div className="min-w-0">
          {label ? (
            <p className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">
              {label}
            </p>
          ) : null}
          {sublabel ? (
            <p className="text-[11px] text-muted">{sublabel}</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export const SegmentBar = ({
  segments,
  className,
  height = 8,
}: {
  segments: Array<{ value: number; tone: string; label?: string }>;
  className?: string;
  height?: number;
}) => {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="flex w-full overflow-hidden rounded-full bg-white/[0.04]"
        style={{ height }}
        role="img"
        aria-label={segments
          .filter((s) => s.value > 0)
          .map((s) => `${s.label ?? ""}: ${s.value}`)
          .join(", ")}
      >
        {segments.map((s, i) =>
          s.value > 0 ? (
            <div
              key={`${s.label ?? i}-${i}`}
              className="transition-[width] duration-400"
              style={{
                width: `${(s.value / total) * 100}%`,
                background: s.tone,
              }}
              title={s.label ? `${s.label}: ${s.value}` : undefined}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: s.tone }}
              />
              {s.label} {s.value}
            </span>
          ))}
      </div>
    </div>
  );
};

export const MiniBars = ({
  values,
  max,
  className,
  barClassName = "bg-accent",
}: {
  values: Array<{ label: string; value: number }>;
  max?: number;
  className?: string;
  barClassName?: string;
}) => {
  const peak = max ?? Math.max(...values.map((v) => v.value), 1);
  return (
    <div className={cn("flex items-end gap-2", className)}>
      {values.map((v) => (
        <div key={v.label} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="font-mono text-[11px] text-foreground">{v.value}</span>
          <div className="flex h-16 w-full items-end rounded-sm bg-white/[0.03] px-1 pb-0.5">
            <div
              className={cn(
                "w-full rounded-sm transition-[height] duration-400",
                barClassName,
              )}
              style={{ height: `${Math.max(4, (v.value / peak) * 100)}%` }}
            />
          </div>
          <span className="truncate text-[10px] text-muted-dim">{v.label}</span>
        </div>
      ))}
    </div>
  );
};

export const ConfidenceBar = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tone =
    pct >= 90 ? "bg-green" : pct >= 75 ? "bg-accent" : "bg-amber";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-[width]", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-[10px] text-muted">
        {pct}%
      </span>
    </div>
  );
};

export const StatStrip = ({
  items,
}: {
  items: Array<{ label: string; value: string | number; hint?: string }>;
}) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {items.map((item) => (
      <div
        key={item.label}
        className="rounded-md border border-border bg-surface px-3 py-2.5"
      >
        <p className="text-[10px] uppercase tracking-[0.1em] text-muted-dim">
          {item.label}
        </p>
        <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-foreground">
          {item.value}
        </p>
        {item.hint ? (
          <p className="mt-0.5 text-[10px] text-muted">{item.hint}</p>
        ) : null}
      </div>
    ))}
  </div>
);
