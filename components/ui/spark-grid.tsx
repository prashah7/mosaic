import { cn } from "@/lib/utils";

type Tone = "purple" | "green" | "amber" | "red" | "lime" | "blue";

const fills: Record<Tone, string[]> = {
  purple: [
    "bg-purple/15",
    "bg-purple/30",
    "bg-purple/50",
    "bg-purple/75",
    "bg-purple",
  ],
  green: [
    "bg-green/15",
    "bg-green/30",
    "bg-green/50",
    "bg-green/75",
    "bg-green",
  ],
  amber: [
    "bg-amber/15",
    "bg-amber/30",
    "bg-amber/50",
    "bg-amber/75",
    "bg-amber",
  ],
  red: ["bg-red/15", "bg-red/30", "bg-red/50", "bg-red/75", "bg-red"],
  lime: ["bg-lime/15", "bg-lime/30", "bg-lime/50", "bg-lime/75", "bg-lime"],
  blue: ["bg-blue/15", "bg-blue/30", "bg-blue/50", "bg-blue/75", "bg-blue"],
};

export const SparkGrid = ({
  seed,
  tone = "purple",
  cols = 10,
  rows = 4,
  className,
}: {
  seed: string;
  tone?: Tone;
  cols?: number;
  rows?: number;
  className?: string;
}) => {
  const cells: number[] = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < cols * rows; i += 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    cells.push(hash % 5);
  }

  return (
    <div
      className={cn("grid gap-[3px]", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {cells.map((level, index) => (
        <span
          key={`${seed}-${index}`}
          className={cn("contrib-cell", fills[tone][level])}
        />
      ))}
    </div>
  );
};
