import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships a durable Convex run and event schema", async () => {
  const [packageJson, schema, runs, events] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../convex/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../convex/runs.ts", import.meta.url), "utf8"),
    readFile(new URL("../convex/runEvents.ts", import.meta.url), "utf8"),
  ]);

  assert.equal(JSON.parse(packageJson).dependencies.convex, "^1.42.1");
  assert.match(schema, /by_idempotency/);
  assert.match(schema, /by_run_sequence/);
  assert.match(runs, /export const upsert/);
  assert.match(events, /export const append/);
});

test("keeps run lifecycle types shared across UI and API", async () => {
  const [contract, uiTypes, apiTypes] = await Promise.all([
    readFile(new URL("../contracts/runs.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/types.ts", import.meta.url), "utf8"),
  ]);

  assert.match(contract, /WAITING_FOR_APPROVAL/);
  assert.match(contract, /isTerminalRunStatus/);
  assert.match(uiTypes, /@\/contracts\/runs/);
  assert.match(apiTypes, /@\/contracts\/runs/);
});

test("keeps the Hermes, API, UI, and Cloudflare orchestration contract aligned", async () => {
  const [hermes, createRoute, cancelRoute, askUi, liveUi, wrangler] =
    await Promise.all([
      readFile(new URL("../src/lib/hermes.ts", import.meta.url), "utf8"),
      readFile(
        new URL(
          "../src/app/api/initiatives/[initiativeId]/runs/route.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../src/app/api/initiatives/[initiativeId]/runs/[runId]/cancel/route.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../components/ask-luci-chat.tsx", import.meta.url), "utf8"),
      readFile(
        new URL("../components/runtime-run-workspace.tsx", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    ]);

  assert.match(hermes, /"MOSAIC_RUN"/);
  assert.match(hermes, /"\/v1\/runs"/);
  assert.match(hermes, /Promise\.allSettled\(SPECIALISTS\.map/);
  assert.match(hermes, /buildCoordinatorRun/);
  assert.match(hermes, /\/stop`/);
  assert.match(createRoute, /Idempotency-Key/);
  assert.match(cancelRoute, /cancelRun/);
  assert.match(askUi, /crypto\.randomUUID\(\)/);
  assert.match(liveUi, /setTimeout\(poll, 1000\)/);
  assert.match(wrangler, /\.open-next\/worker\.js/);
  assert.match(wrangler, /nodejs_compat/);
});
