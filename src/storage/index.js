// storage/index.js: Decision record CRUD over Forge KVS (tag+keyword search, no embeddings).
import { getKvs, resetBackend } from "./storage.js";
export { resetBackend };

const PREFIX = "decision:";
const INDEX_KEY = "decisions:index";

function str(v) { return (v == null ? "" : String(v)).toLowerCase(); }

async function readIndex(kvs) {
  const idx = await kvs.get(INDEX_KEY);
  return Array.isArray(idx) ? idx : [];
}

async function writeIndex(kvs, idx) {
  await kvs.set(INDEX_KEY, idx);
}

export async function saveDecision(decision) {
  const kvs = await getKvs();
  const d = { ...decision };
  if (!d.id) d.id = `dec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (!d.decidedAt) d.decidedAt = new Date().toISOString();
  if (!d.status) d.status = "active";
  if (!Array.isArray(d.alternativesRejected)) d.alternativesRejected = d.alternativesRejected ? [d.alternativesRejected] : [];
  if (!Array.isArray(d.tags)) d.tags = d.tags ? [d.tags] : [];
  await kvs.set(PREFIX + d.id, d);
  const idx = await readIndex(kvs);
  if (!idx.includes(d.id)) {
    idx.push(d.id);
    await writeIndex(kvs, idx);
  }
  return d;
}

export async function getDecision(id) {
  const kvs = await getKvs();
  const d = await kvs.get(PREFIX + id);
  return d || null;
}

export async function listDecisions() {
  const kvs = await getKvs();
  const idx = await readIndex(kvs);
  const out = [];
  for (const id of idx) {
    const d = await kvs.get(PREFIX + id);
    if (d) out.push(d);
  }
  return out;
}

export async function searchDecisions(keywords = [], tags = []) {
  const kws = (keywords || []).map((k) => str(k)).filter(Boolean);
  const tgs = (tags || []).map((t) => str(t)).filter(Boolean);
  const all = await listDecisions();
  const scored = all.map((d) => {
    let score = 0;
    const dtags = (d.tags || []).map(str);
    for (const t of tgs) if (dtags.includes(t)) score += 10;
    const haystack = [d.title, d.summary, d.reasoning, ...(d.tags || []), ...(d.alternativesRejected || [])].map(str).join(" ");
    for (const k of kws) {
      if (haystack.includes(k)) score += 5;
      // bonus for title match
      if (str(d.title).includes(k)) score += 3;
    }
    return { d, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.d);
}

export async function updateStatus(id, status) {
  const kvs = await getKvs();
  const d = await kvs.get(PREFIX + id);
  if (!d) throw new Error(`Decision not found: ${id}`);
  d.status = status;
  await kvs.set(PREFIX + id, d);
  return d;
}