import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateMultiAgentRun } from "../evals/multi-agent-evaluator.mjs";

async function fixture(name) {
  const raw = await readFile(new URL(`../evals/fixtures/${name}.json`, import.meta.url), "utf8");
  return JSON.parse(raw);
}

test("accepts a cited parallel fan-out coordinated into mosaic.run.v1", async () => {
  const result = evaluateMultiAgentRun(await fixture("happy-path"));
  assert.equal(result.valid, true, JSON.stringify(result.checks.filter((item) => !item.passed), null, 2));
  assert.equal(result.score, 100);
});

test("accepts explicit partial success without hiding the failed specialist", async () => {
  const result = evaluateMultiAgentRun(await fixture("partial-success"));
  assert.equal(result.valid, true, JSON.stringify(result.checks.filter((item) => !item.passed), null, 2));
  assert.equal(result.score, 100);
});

test("accepts fatal failure only when no final synthesis is published", async () => {
  const result = evaluateMultiAgentRun(await fixture("failed-run"));
  assert.equal(result.valid, true, JSON.stringify(result.checks.filter((item) => !item.passed), null, 2));
  assert.equal(result.score, 100);
});

test("rejects sequential specialists disguised as fan-out", async () => {
  const candidate = await fixture("happy-path");
  candidate.specialists.forEach((specialist, index) => {
    specialist.started_at = `2026-07-11T12:00:0${index * 2}.000Z`;
    specialist.completed_at = `2026-07-11T12:00:0${index * 2 + 1}.000Z`;
  });
  const result = evaluateMultiAgentRun(candidate);
  assert.equal(result.valid, false);
  assert.equal(result.checks.find((item) => item.name === "specialists actually overlap")?.passed, false);
});

test("rejects uncited claims and unknown source IDs", async () => {
  const candidate = await fixture("happy-path");
  candidate.output.risks[0].source_ids = [];
  candidate.output.actions[0].source_ids = ["src_invented"];
  const result = evaluateMultiAgentRun(candidate);
  assert.equal(result.valid, false);
  assert.equal(result.checks.find((item) => item.name === "every durable claim is cited")?.passed, false);
  assert.equal(result.checks.find((item) => item.name === "citations use supplied source IDs")?.passed, false);
});

test("rejects a coordinator that drops a successful specialist", async () => {
  const candidate = await fixture("happy-path");
  candidate.coordinator.input_specialist_ids = candidate.coordinator.input_specialist_ids.slice(1);
  const result = evaluateMultiAgentRun(candidate);
  assert.equal(result.valid, false);
  assert.equal(result.checks.find((item) => item.name === "coordinator consumed every successful specialist")?.passed, false);
});

test("rejects partial success that is not surfaced to the user", async () => {
  const candidate = await fixture("partial-success");
  candidate.run.failure_semantics.surfaced_to_user = false;
  candidate.coordinator.failed_specialist_ids = [];
  const result = evaluateMultiAgentRun(candidate);
  assert.equal(result.valid, false);
  assert.equal(result.checks.find((item) => item.name === "partial semantics are surfaced")?.passed, false);
  assert.equal(result.checks.find((item) => item.name === "coordinator reports every failed specialist")?.passed, false);
});
