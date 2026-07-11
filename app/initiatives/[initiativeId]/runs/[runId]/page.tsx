import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RunWorkspace } from "@/components/run-workspace";
import { RuntimeRunWorkspace } from "@/components/runtime-run-workspace";
import {
  getEventsForRun,
  getInitiative,
  getRun,
  getTasksForRun,
} from "@/lib/mosaic-data";

type PageProps = {
  params: Promise<{ initiativeId: string; runId: string }>;
};

export default async function RunPage({ params }: PageProps) {
  const { initiativeId, runId } = await params;
  const initiative = getInitiative(initiativeId);
  const run = getRun(runId);

  if (!initiative) {
    notFound();
  }

  if (!run) {
    return (
      <Suspense
        fallback={
          <div
            className="mx-auto max-w-3xl py-8 text-sm text-muted"
            role="status"
          >
            Loading run…
          </div>
        }
      >
        <RuntimeRunWorkspace
          initiativeId={initiativeId}
          initiativeName={initiative.name}
          runId={runId}
        />
      </Suspense>
    );
  }

  if (run.initiativeId !== initiativeId) {
    notFound();
  }

  const tasks = getTasksForRun(runId);
  const events = getEventsForRun(runId);

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl py-8 text-sm text-muted">
          Starting Luci…
        </div>
      }
    >
      <RunWorkspace
        initiative={initiative}
        run={run}
        tasks={tasks}
        events={events}
      />
    </Suspense>
  );
}
