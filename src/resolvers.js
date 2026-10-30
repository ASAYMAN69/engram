// resolvers.js: Engram Rovo action backing resolvers (ESM).
import { listDecisions, searchDecisions, saveDecision } from "./storage/index.js";

function tokenize(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2);
}

function makeId() {
  return "dec-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
}

const STOP = new Set(["the", "and", "for", "with", "this", "that", "are", "was", "has", "have", "will", "not", "but", "about"]);

function keywordsFromText(text) {
  return [...new Set(tokenize(text).filter((w) => !STOP.has(w)))];
}

export async function extractDecision({ text } = {}) {
  const t = String(text || "").trim();
  const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const first = lines[0] || t;
  const title = first.length > 80 ? first.slice(0, 77) + "..." : (first || "Untitled decision");
  const tags = keywordsFromText(t).slice(0, 6);
  return {
    id: makeId(),
    title,
    summary: t.slice(0, 280) || title,
    reasoning: t,
    alternativesRejected: [],
    decidedBy: "Unknown",
    decidedAt: new Date().toISOString(),
    status: "active",
    tags,
    sourceUrl: "",
    sourceType: "manual"
  };
}

export async function searchDecisionsResolver(input) {
  let keywords = [];
  let tags = [];
  if (typeof input === "string") {
    keywords = keywordsFromText(input);
  } else if (input && typeof input === "object") {
    const q = input.question || input.query || input.q;
    if (q) keywords = keywords.concat(keywordsFromText(q));
    if (Array.isArray(input.keywords)) keywords = keywords.concat(input.keywords);
    if (Array.isArray(input.tags)) tags = tags.concat(input.tags);
    if (typeof input.keywords === "string") keywords = keywords.concat(keywordsFromText(input.keywords));
    if (typeof input.tags === "string") tags = tags.concat(input.tags.split(/[,\s]+/).filter(Boolean));
  }
  keywords = [...new Set(keywords.map((k) => String(k).toLowerCase()))];
  tags = [...new Set(tags.map((t) => String(t).toLowerCase()))];
  const results = await searchDecisions(keywords, tags);
  if (results.length === 0 && keywords.length === 0 && tags.length === 0) {
    return await listDecisions();
  }
  return results;
}

const NEGATIONS = ["no", "not", "never", "avoid", "without", "disable", "remove", "drop", "cancel", "instead", "replace", "switch"];
const CONTRAST = ["instead of", "rather than", "but", "however", "no longer", "switch to", "migrate to", "replace"];

export async function checkConflict({ proposedChange } = {}) {
  const text = String(proposedChange || "").trim();
  const props = tokenize(text);
  const propSet = new Set(props);
  const decisions = await listDecisions();
  const active = decisions.filter((d) => d.status === "active");
  let best = null;
  let bestScore = 0;
  for (const d of active) {
    const dTokens = new Set(tokenize([d.title, d.summary, ...(d.tags || [])].join(" ")));
    let overlap = 0;
    for (const p of propSet) if (dTokens.has(p)) overlap++;
    const hasNeg = props.some((w) => NEGATIONS.includes(w));
    const decisionNeg = tokenize([d.title, d.summary].join(" ")).some((w) => NEGATIONS.includes(w));
    const conflictSignal = overlap >= 1 && (hasNeg !== decisionNeg);
    const score = overlap + (conflictSignal ? 5 : 0);
    if (score > bestScore) { bestScore = score; best = { d, overlap, conflictSignal }; }
  }
  if (best && best.overlap >= 1 && best.conflictSignal && bestScore >= 6) {
    return { conflicts: true, reason: `Proposed change contradicts active decision "${best.d.title}" (${best.d.id}): ${best.d.summary}`, decisionId: best.d.id };
  }
  const lower = text.toLowerCase();
  for (const d of active) {
    const dTokens = new Set(tokenize([d.title, d.summary, ...(d.tags || [])].join(" ")));
    let overlap = 0;
    for (const p of propSet) if (dTokens.has(p)) overlap++;
    if (overlap >= 2 && CONTRAST.some((c) => lower.includes(c))) {
      return { conflicts: true, reason: `Proposed change may conflict with active decision "${d.title}" (${d.id}): ${d.summary}`, decisionId: d.id };
    }
  }
  return { conflicts: false, reason: "No conflicting active decision found." };
}

export async function getText() { return "Hello Engram"; }

export async function loadDemoData() {
  const { loadDemoData: ld } = await import("./storage/seed.js");
  return ld();
}

export { saveDecision } from "./storage/index.js";
