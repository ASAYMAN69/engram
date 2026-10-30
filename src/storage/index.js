const seed = require("./seed");

let decisions = seed.map((d) => ({ ...d, alternativesRejected: [...d.alternativesRejected], tags: [...d.tags] }));

function score(decision, keywords, tags) {
  const kw = (keywords || []).map((k) => String(k).toLowerCase());
  const tg = (tags || []).map((t) => String(t).toLowerCase());
  const hay = [decision.title, decision.summary, decision.reasoning, ...(decision.tags || [])].join(" ").toLowerCase();
  let s = 0;
  for (const k of kw) if (k && hay.includes(k)) s += 2;
  for (const t of tg) if (t && (decision.tags || []).map((x) => x.toLowerCase()).includes(t)) s += 3;
  return s;
}

async function saveDecision(decision) {
  const idx = decisions.findIndex((d) => d.id === decision.id);
  if (idx >= 0) decisions[idx] = { ...decision };
  else decisions.push({ ...decision });
  return decisions.find((d) => d.id === decision.id);
}

async function getDecision(id) {
  return decisions.find((d) => d.id === id) || null;
}

async function listDecisions() {
  return decisions.map((d) => ({ ...d }));
}

async function searchDecisions(keywords, tags) {
  const kw = Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []);
  const tg = Array.isArray(tags) ? tags : (tags ? [tags] : []);
  return decisions
    .map((d) => ({ d, s: score(d, kw, tg) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => ({ ...x.d }));
}

async function updateStatus(id, status) {
  const d = decisions.find((x) => x.id === id);
  if (!d) throw new Error("not found");
  d.status = status;
  return { ...d };
}

function resetToSeed() {
  decisions = seed.map((d) => ({ ...d, alternativesRejected: [...d.alternativesRejected], tags: [...d.tags] }));
  return decisions.length;
}

module.exports = { saveDecision, getDecision, listDecisions, searchDecisions, updateStatus, resetToSeed };