import test from "node:test";
import assert from "node:assert/strict";
import { resetBackend } from "../src/storage/index.js";
import { loadDemoData } from "../src/storage/seed.js";
import { handleIssueCreated, extractIssueText, isOwnComment } from "../src/triggers/issueCreated.js";

test("extractIssueText from event", () => {
  const e = { issue: { id: "1", key: "PROJ-1", fields: { summary: "Switch to MySQL", description: "we want mysql" } } };
  const r = extractIssueText(e);
  assert.equal(r.key, "PROJ-1");
  assert.equal(r.summary, "Switch to MySQL");
});

test("isOwnComment detects app author", () => {
  assert.equal(isOwnComment({ author: { accountId: "app1" } }, "app1"), true);
  assert.equal(isOwnComment({ author: { accountId: "user2" } }, "app1"), false);
});

test("handleIssueCreated posts comment on conflict", async () => {
  resetBackend();
  await loadDemoData();
  let called = null;
  const deps = {
    requestJira: async (url, init) => { called = { url, init }; return { ok: true, status: 201 }; },
    route: (s, ...v) => s.reduce((a, x, i) => a + x + (i < v.length ? v[i] : ""), ""),
  };
  const ev = { issue: { id: "1", key: "PROJ-2", fields: { summary: "switch from Postgres to MySQL", description: "migrate database" } } };
  const res = await handleIssueCreated(ev, deps);
  assert.equal(res.conflicts, true);
  assert.equal(res.posted, true);
  assert.ok(called);
});

test("handleIssueCreated skips own comment", async () => {
  resetBackend();
  await loadDemoData();
  const ev = { comment: { author: { accountId: "app1" } }, issue: { key: "PROJ-3", fields: { summary: "x" } } };
  const res = await handleIssueCreated(ev, { appAccountId: "app1", requestJira: async () => ({ ok: true }), route: (s,...v)=>s.join("") });
  assert.equal(res.skipped, true);
});
