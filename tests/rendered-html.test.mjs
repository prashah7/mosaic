import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Mosaic PM workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Mosaic/);
  assert.match(html, /Enterprise SSO GA/);
  assert.match(html, /Launch SAML SSO for 10 design partners/);
  assert.match(html, /Ask Luci/);
  assert.match(html, /Hermes ready/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the seeded evidence required for the memory demo", async () => {
  const [role, prd, meeting, slack] = await Promise.all([
    readFile(new URL("../data/seed/pm-role.md", import.meta.url), "utf8"),
    readFile(new URL("../data/seed/enterprise-sso-prd.md", import.meta.url), "utf8"),
    readFile(new URL("../data/seed/identity-architecture-review.md", import.meta.url), "utf8"),
    readFile(new URL("../data/seed/slack-thread.json", import.meta.url), "utf8"),
  ]);
  assert.match(role, /Product Manager R&R/);
  assert.match(prd, /self-serve/i);
  assert.match(meeting, /conflicts with the approved self-serve experience/i);
  assert.match(meeting, /No owner was assigned/i);
  assert.doesNotThrow(() => JSON.parse(slack));
});

test("keeps the Hermes API key server-side", async () => {
  const [client, route, statusRoute, soul, skill] = await Promise.all([
    readFile(new URL("../app/MosaicApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/luci/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/luci/[runId]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../hermes/luci/SOUL.md", import.meta.url), "utf8"),
    readFile(new URL("../hermes/luci/skills/mosaic-project-manager/SKILL.md", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(client, /HERMES_API_KEY/);
  assert.match(route, /process\.env\.HERMES_API_KEY/);
  assert.match(route, /X-Hermes-Session-Key/);
  assert.match(route, /fixture/);
  assert.match(statusRoute, /v1\/runs/);
  assert.match(soul, /You are Luci/);
  assert.match(skill, /MOSAIC_RUN/);
  assert.match(skill, /SUPERSEDE/);
  assert.match(skill, /human_assignment_required/);
});
