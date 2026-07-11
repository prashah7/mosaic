import type { RunEvent } from "@/contracts/runs";

type NewRunEvent = Pick<RunEvent, "eventType" | "level" | "message" | "agentTaskId">;

export type RunEventBuffer = {
  emit(event: NewRunEvent): RunEvent;
  snapshot(): RunEvent[];
};

export function createRunEventBuffer(runId: string, traceId: string): RunEventBuffer {
  const events: RunEvent[] = [];

  return {
    emit(event) {
      const record: RunEvent = {
        ...event,
        id: crypto.randomUUID(),
        runId,
        traceId,
        sequence: events.length + 1,
        createdAt: new Date().toISOString(),
      };
      events.push(record);

      console.log(JSON.stringify({
        service: "mosaic",
        runId,
        traceId,
        sequence: record.sequence,
        eventType: record.eventType,
        level: record.level,
        agentTaskId: record.agentTaskId,
        message: record.message,
      }));
      return record;
    },
    snapshot() {
      return [...events];
    },
  };
}

export function userSafeError(error: unknown): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "The specialist timed out";
  }
  if (error instanceof Error && /^Hermes returned HTTP \d{3}$/.test(error.message)) {
    return error.message;
  }
  if (error instanceof Error && error.message === "Hermes returned invalid JSON") {
    return error.message;
  }
  return "The specialist could not complete its task";
}
