import test from "node:test";
import assert from "node:assert/strict";
import { resetBackend } from "../src/storage/index.js";
import { saveDecision, getDecision, listDecisions, searchDecisions, updateStatus } from "../src/storage/index.js";
import { loadDemoData, DEMO_DECISIONS } from "../src/storage/seed.js";

test("save/get/list", async () => {
  resetBackend();
  const d = await saveDecision({ id: "t1", title: "Use Postgres", summary: "db", reasoning: "r", tags: ["database"], decidedBy: "a", status: "active" });
  assert.equal(d.id, "t1");
  const got = await getDecision("t1");
  assert.equal(got.title, "Use Postgres");
  const all = await listDecisions();
  assert.equal(all.length, 1);
});

test("updateStatus", async () => {
  resetBackend();
  await saveDecision({ id: "t2", title: "X", summary: "y", reasoning: "z", tags: [], decidedBy: "a", status: "active" });
  const u = await updateStatus("t2", "superseded");
  assert.equal(u.status, "superseded");
  const got = await getDecision("t2");
  assert.equal(got.status, "superseded");
});

test("search scoring top3", async () => {
  resetBackend();
  await saveDecision({ id: "a", title: "PostgreSQL orders", summary: "database choice", reasoning: "acid", tags: ["database","postgres"], decidedBy: "x", status: "active" });
  await saveDecision({ id: "b", title: "Redis cache", summary: "caching", reasoning: "fast", tags: ["caching","redis"], decidedBy: "x", status: "active" });
  const res = await searchDecisions(["database"], ["postgres"]);
  assert.equal(res.length, 1);
  assert.equal(res[0].id, "a");
});

test("loadDemoData inserts 18", async () => {
  resetBackend();
  const r = await loadDemoData();
  assert.equal(r.count, 18);
  const all = await listDecisions();
  assert.equal(all.length, 18);
  const superseded = all.filter(d => d.status === "superseded");
  assert.equal(superseded.length, 3);
});