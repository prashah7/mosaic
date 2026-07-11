import Link from "next/link";
import { Panel } from "@/components/ui/panel";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <Panel className="w-full space-y-4 p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-dim">
          404
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-foreground">
          Not found in this workspace
        </h1>
        <p className="text-sm text-muted">
          That initiative or run is outside the seeded Mosaic prototype.
        </p>
        <Link
          href="/"
          className="mx-auto inline-flex items-center rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-[#0f0f10] transition hover:bg-accent-hover focus-ring"
        >
          Back to dashboard
        </Link>
      </Panel>
    </div>
  );
}
