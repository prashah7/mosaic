"use client";

import { Suspense, use, useEffect, useState } from "react";
import { RunWorkspace } from "@/components/run-workspace";
import { api, useBackendInitiative } from "@/lib/backend-client";
import type { Artifact, Run } from "@/lib/types";

type PageProps = {
  params: Promise<{ initiativeId: string; runId: string }>;
};

export default function RunPage({ params }: PageProps) {
  const { initiativeId, runId } = use(params);
  const { initiative, error: initiativeError } = useBackendInitiative(initiativeId);
  const [run, setRun] = useState<Run | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.run(initiativeId, runId).then(
      (data) => { setRun(data.run); setArtifacts(data.artifacts); },
      (cause) => setError(cause instanceof Error ? cause.message : "Could not load run"),
    );
  }, [initiativeId, runId]);

  if (!initiative || !run) return <p className="p-6 text-sm text-muted">{error ?? initiativeError ?? "Loading run…"}</p>;

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
        tasks={[]}
        events={[]}
        artifacts={artifacts}
      />
    </Suspense>
  );
}
