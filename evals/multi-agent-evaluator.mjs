const SPECIALIST_ROLES = [
  "evidence_retriever",
  "decision_risk_analyst",
  "commitment_action_analyst",
  "memory_curator",
];

const COORDINATOR_ROLE = "artifact_generator";

const CLAIM_COLLECTIONS = [
  "what_changed",
  "decisions",
  "commitments",
  "risks",
  "dependencies",
  "open_questions",
  "memory_proposals",
  "actions",
];

const REQUIRED_OUTPUT_FIELDS = [
  "schema_version",
  "run_type",
  "initiative_id",
  "executive_summary",
  ...CLAIM_COLLECTIONS,
  "mermaid",
  "specialist_trace",
];

function check(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function intervalsOverlap(left, right) {
  if (![left.started_at, left.completed_at, right.started_at, right.completed_at].every(validDate)) {
    return false;
  }
  return Math.max(Date.parse(left.started_at), Date.parse(right.started_at))
    < Math.min(Date.parse(left.completed_at), Date.parse(right.completed_at));
}

function evaluateFanOut(specialists) {
  const roles = new Set(specialists.map((specialist) => specialist.role));
  const successful = specialists.filter((specialist) => specialist.status === "COMPLETED");
  const overlaps = successful.some((left, index) =>
    successful.slice(index + 1).some((right) => intervalsOverlap(left, right)));

  return [
    check(
      "specialist roles are unique",
      roles.size === specialists.length,
      `${roles.size}/${specialists.length} unique roles`,
    ),
    check(
      "all specialist roles are represented",
      SPECIALIST_ROLES.every((role) => roles.has(role)),
      `expected ${SPECIALIST_ROLES.join(", ")}`,
    ),
    check(
      "specialists actually overlap",
      overlaps || successful.length < 2,
      overlaps ? "at least two successful execution intervals overlap" : "no overlapping successful intervals",
    ),
  ];
}

function evaluateCoordinator(envelope) {
  const successfulIds = envelope.specialists
    .filter((specialist) => specialist.status === "COMPLETED")
    .map((specialist) => specialist.id)
    .sort();
  const failedIds = envelope.specialists
    .filter((specialist) => specialist.status === "FAILED")
    .map((specialist) => specialist.id)
    .sort();
  const coordinatorInputs = [...(envelope.coordinator.input_specialist_ids ?? [])].sort();
  const warningIds = [...(envelope.coordinator.failed_specialist_ids ?? [])].sort();

  if (envelope.run.status === "FAILED") {
    return [
      check(
        "failed run does not claim aggregation",
        envelope.coordinator.status === "FAILED" || envelope.coordinator.status === "NOT_RUN",
        `coordinator status is ${envelope.coordinator.status}`,
      ),
    ];
  }

  return [
    check(
      "coordinator role is explicit",
      envelope.coordinator.role === COORDINATOR_ROLE,
      `coordinator role is ${envelope.coordinator.role ?? "missing"}`,
    ),
    check(
      "coordinator completed",
      envelope.coordinator.status === "COMPLETED",
      `coordinator status is ${envelope.coordinator.status}`,
    ),
    check(
      "coordinator consumed every successful specialist",
      JSON.stringify(coordinatorInputs) === JSON.stringify(successfulIds),
      `inputs=${coordinatorInputs.join(",")}; successful=${successfulIds.join(",")}`,
    ),
    check(
      "coordinator reports every failed specialist",
      JSON.stringify(warningIds) === JSON.stringify(failedIds),
      `reported=${warningIds.join(",")}; failed=${failedIds.join(",")}`,
    ),
  ];
}

function evaluateOutput(output, allowedSourceIds, requiredTraceRoles) {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return [check("output exists", false, "expected a mosaic.run.v1 object")];
  }

  const missingFields = REQUIRED_OUTPUT_FIELDS.filter((field) => !(field in output));
  const claims = CLAIM_COLLECTIONS.flatMap((collection) =>
    Array.isArray(output[collection])
      ? output[collection].map((item) => ({ collection, item }))
      : []);
  const citedClaims = claims.filter(({ item }) =>
    Array.isArray(item?.source_ids) && item.source_ids.length > 0);
  const invalidSourceIds = citedClaims.flatMap(({ item }) => item.source_ids)
    .filter((sourceId) => !allowedSourceIds.has(sourceId));
  const traceRoles = new Set(
    Array.isArray(output.specialist_trace)
      ? output.specialist_trace.map((trace) => trace.agent)
      : [],
  );

  return [
    check(
      "mosaic.run.v1 fields are complete",
      output.schema_version === "mosaic.run.v1" && missingFields.length === 0,
      missingFields.length ? `missing ${missingFields.join(", ")}` : "all required fields present",
    ),
    check(
      "claim collections are arrays",
      CLAIM_COLLECTIONS.every((field) => Array.isArray(output[field])),
      "all evidence-bearing fields must be arrays",
    ),
    check(
      "every durable claim is cited",
      claims.length > 0 && citedClaims.length === claims.length,
      `${citedClaims.length}/${claims.length} claims cited`,
    ),
    check(
      "citations use supplied source IDs",
      invalidSourceIds.length === 0,
      invalidSourceIds.length ? `unknown IDs: ${[...new Set(invalidSourceIds)].join(", ")}` : "all citation IDs are allowed",
    ),
    check(
      "specialist trace covers every agent",
      requiredTraceRoles.every((role) => traceRoles.has(role)),
      `trace roles: ${[...traceRoles].join(", ")}`,
    ),
  ];
}

function evaluateSemantics(envelope) {
  const failedCount = envelope.specialists.filter((specialist) => specialist.status === "FAILED").length;
  const successfulCount = envelope.specialists.filter((specialist) => specialist.status === "COMPLETED").length;
  const semantics = envelope.run.failure_semantics ?? {};

  if (envelope.run.outcome === "SUCCESS") {
    return [
      check("success has no failed specialists", failedCount === 0, `${failedCount} failed`),
      check("success has output", Boolean(envelope.output), "successful runs must be renderable"),
      check("success semantics are explicit", semantics.mode === "none", `mode=${semantics.mode}`),
    ];
  }

  if (envelope.run.outcome === "PARTIAL_SUCCESS") {
    return [
      check("partial run remains completed", envelope.run.status === "COMPLETED", `status=${envelope.run.status}`),
      check("partial run has mixed specialist results", failedCount > 0 && successfulCount > 0, `${successfulCount} completed, ${failedCount} failed`),
      check("partial output remains available", Boolean(envelope.output), "partial success must produce renderable output"),
      check("partial semantics are surfaced", semantics.mode === "partial" && semantics.surfaced_to_user === true, `mode=${semantics.mode}`),
    ];
  }

  if (envelope.run.outcome === "FAILED") {
    return [
      check("fatal outcome uses failed status", envelope.run.status === "FAILED", `status=${envelope.run.status}`),
      check("fatal run has no misleading output", envelope.output == null, "failed orchestration must not publish a final synthesis"),
      check("fatal semantics are surfaced", semantics.mode === "fatal" && semantics.surfaced_to_user === true, `mode=${semantics.mode}`),
    ];
  }

  return [check("outcome is recognized", false, `unknown outcome ${envelope.run.outcome}`)];
}

export function evaluateMultiAgentRun(envelope) {
  const specialists = Array.isArray(envelope?.specialists) ? envelope.specialists : [];
  const allowedSourceIds = new Set(envelope?.available_source_ids ?? []);
  const traceRoles = [...specialists.map((specialist) => specialist.role), COORDINATOR_ROLE];
  const checks = [
    check("run envelope exists", Boolean(envelope?.run && envelope?.coordinator), "run and coordinator are required"),
    ...evaluateFanOut(specialists),
    ...evaluateCoordinator({ ...envelope, specialists }),
    ...evaluateSemantics({ ...envelope, specialists }),
  ];

  if (envelope?.run?.status !== "FAILED") {
    checks.push(...evaluateOutput(envelope.output, allowedSourceIds, traceRoles));
  }

  const passed = checks.filter((item) => item.passed).length;
  return {
    valid: passed === checks.length,
    score: Math.round((passed / checks.length) * 100),
    passed,
    total: checks.length,
    checks,
  };
}

export { CLAIM_COLLECTIONS, COORDINATOR_ROLE, REQUIRED_OUTPUT_FIELDS, SPECIALIST_ROLES };
