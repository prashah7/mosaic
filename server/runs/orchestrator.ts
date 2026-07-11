import type {
  AgentTaskSnapshot,
  AgentType,
  StartRunRequest,
  StartRunResponse,
} from "@/contracts/runs";
import {
  createHermesClientFromEnv,
  type HermesClient,
} from "@/server/hermes/client";
import {
  createRunEventBuffer,
  userSafeError,
} from "@/server/observability/run-events";

type SpecialistPlan = {
  agentType: AgentType;
  instruction: string;
};

const CONTEXT_TASK: SpecialistPlan = {
  agentType: "CONTEXT_RETRIEVER",
  instruction: "Retrieve only initiative evidence relevant to the run intent. Return source identifiers and concise excerpts.",
};

const PARALLEL_SPECIALISTS: SpecialistPlan[] = [
  {
    agentType: "SYNTHESIZER",
    instruction: "Synthesize facts, decisions, risks, dependencies, and open questions with citations. Distinguish facts from inference.",
  },
  {
    agentType: "ARTIFACT_GENERATOR",
    instruction: "Produce a structured initiative map from cited project state. Do not add unsupported relationships.",
  },
  {
    agentType: "MEMORY_CURATOR",
    instruction: "Propose durable memory additions, confirmations, disputes, or supersessions. Preserve provenance and never overwrite silently.",
  },
  {
    agentType: "ACTION_MANAGER",
    instruction: "Extract explicit commitments and propose follow-ups. Never invent an owner, deadline, or priority.",
  },
];

function fixtureResponse(
  request: StartRunRequest,
  runId: string,
  traceId: string,
): StartRunResponse {
  const events = createRunEventBuffer(runId, traceId);
  events.emit({
    eventType: "run.fixture_selected",
    level: "WARNING",
    message: "Hermes is not configured; using the deterministic demo run",
  });

  const tasks = [CONTEXT_TASK, ...PARALLEL_SPECIALISTS].map((plan, index) => {
    const task: AgentTaskSnapshot = {
      id: `${runId}:${plan.agentType.toLowerCase()}`,
      agentType: plan.agentType,
      status: "COMPLETED",
      durationMs: 180 + index * 70,
      outputSummary: `${plan.agentType} completed with seeded evidence`,
    };
    events.emit({
      eventType: "task.completed",
      level: "INFO",
      message: task.outputSummary ?? "Task completed",
      agentTaskId: task.id,
    });
    return task;
  });

  events.emit({
    eventType: "run.completed",
    level: "INFO",
    message: `${request.type} fixture run completed`,
  });

  return {
    runId,
    traceId,
    mode: "fixture",
    status: "COMPLETED",
    message: "Hermes is unavailable; the schema-valid fixture completed this run.",
    tasks,
    events: events.snapshot(),
  };
}

export async function startLuciRun(
  request: StartRunRequest,
  runtime: HermesClient | null = createHermesClientFromEnv(),
): Promise<StartRunResponse> {
  const runId = request.runId ?? crypto.randomUUID();
  const traceId = crypto.randomUUID();
  if (!runtime) return fixtureResponse(request, runId, traceId);

  const events = createRunEventBuffer(runId, traceId);
  const tasks: AgentTaskSnapshot[] = [];
  events.emit({
    eventType: "run.started",
    level: "INFO",
    message: `${request.type} run started`,
  });

  async function execute(plan: SpecialistPlan, context?: string) {
    const task: AgentTaskSnapshot = {
      id: `${runId}:${plan.agentType.toLowerCase()}`,
      agentType: plan.agentType,
      status: "RUNNING",
    };
    tasks.push(task);
    events.emit({
      eventType: "task.started",
      level: "INFO",
      message: `${plan.agentType} started`,
      agentTaskId: task.id,
    });

    const startedAt = performance.now();
    try {
      const result = await runtime.executeTask({
        runId,
        traceId,
        agentType: plan.agentType,
        instruction: plan.instruction,
        context,
        run: request,
      });
      task.status = "COMPLETED";
      task.durationMs = Math.round(performance.now() - startedAt);
      task.outputSummary = result.summary;
      events.emit({
        eventType: "task.completed",
        level: "INFO",
        message: result.summary,
        agentTaskId: task.id,
      });
      return result.context ?? result.summary;
    } catch (error) {
      task.status = "FAILED";
      task.durationMs = Math.round(performance.now() - startedAt);
      task.errorMessage = userSafeError(error);
      events.emit({
        eventType: "task.failed",
        level: "ERROR",
        message: task.errorMessage,
        agentTaskId: task.id,
      });
      throw error;
    }
  }

  let context: string;
  try {
    context = await execute(CONTEXT_TASK);
  } catch {
    events.emit({
      eventType: "run.degraded",
      level: "ERROR",
      message: "Context retrieval failed; dependent specialists were not started",
    });
    return {
      runId,
      traceId,
      mode: "hermes",
      status: "DEGRADED",
      message: "The run started, but context retrieval failed.",
      tasks,
      events: events.snapshot(),
    };
  }

  const results = await Promise.allSettled(
    PARALLEL_SPECIALISTS.map((plan) => execute(plan, context)),
  );
  const failedTasks = results.filter((result) => result.status === "rejected").length;
  const status = failedTasks === 0 ? "COMPLETED" : "DEGRADED";
  events.emit({
    eventType: status === "COMPLETED" ? "run.completed" : "run.degraded",
    level: status === "COMPLETED" ? "INFO" : "WARNING",
    message: status === "COMPLETED"
      ? "All specialist tasks completed"
      : `${failedTasks} specialist task(s) failed`,
  });

  return {
    runId,
    traceId,
    mode: "hermes",
    status,
    message: status === "COMPLETED"
      ? "Luci completed the run."
      : "Luci completed the run with partial results.",
    tasks,
    events: events.snapshot(),
  };
}
