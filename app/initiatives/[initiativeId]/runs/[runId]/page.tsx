import { notFound } from "next/navigation";
import { RunWorkspace } from "@/components/run-workspace";
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

  if (!initiative || !run || run.initiativeId !== initiativeId) {
    notFound();
  }

  const tasks = getTasksForRun(runId);
  const events = getEventsForRun(runId);

  return (
    <RunWorkspace
      initiative={initiative}
      run={run}
      tasks={tasks}
      events={events}
    />
  );
}
