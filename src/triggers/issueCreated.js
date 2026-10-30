// issueCreated.js: Forge trigger handler for jira:issue created.
// On issue creation, read summary/description, run checkConflict, and post a
// comment as the app when a conflict is found. Loop guard: ignore comments
// authored by the app itself.

import { checkConflict } from "../resolvers.js";
import { getDecision } from "../storage/index.js";

function safeText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(safeText).join(" ");
  if (typeof v === "object") {
    if (typeof v.text === "string" && (v.type === "text" || !v.content)) {
      // leaf text node or simple object
      if (v.content) return safeText(v.content);
      return v.text;
    }
    if (v.content) return safeText(v.content);
    if (v.summary) return safeText(v.summary);
    if (v.description) return safeText(v.description);
  }
  return "";
}

export function extractIssueText(event) {
  const e = (event && event.payload) ? event.payload : (event || {});
  const issue = e.issue || e;
  const fields = (issue && issue.fields) ? issue.fields : (issue || {});
  const summary = fields.summary != null ? fields.summary : (issue.summary != null ? issue.summary : "");
  const description = fields.description != null ? fields.description : (issue.description != null ? issue.description : "");
  return {
    id: issue.id || fields.id || null,
    key: issue.key || fields.key || null,
    summary: typeof summary === "string" ? summary : safeText(summary),
    description: typeof description === "string" ? description : safeText(description),
  };
}

export function isOwnComment(comment, appAccountId) {
  if (!comment || !appAccountId) return false;
  const author = comment.author || comment.user || comment.creator || {};
  const id = author.accountId || author.id || author.key;
  return String(id) === String(appAccountId);
}

function buildAdf(reason, decision) {
  const content = [];
  content.push({
    type: "paragraph",
    content: [{ type: "text", text: "Engram detected a potential conflict with an active decision.", marks: [{ type: "strong" }] }],
  });
  content.push({
    type: "paragraph",
    content: [{ type: "text", text: String(reason || "") }],
  });
  if (decision && decision.sourceUrl) {
    content.push({
      type: "paragraph",
      content: [
        { type: "text", text: "Source: " },
        { type: "text", text: String(decision.sourceUrl), marks: [{ type: "link", attrs: { href: String(decision.sourceUrl) } }] },
      ],
    });
  }
  return { type: "doc", version: 1, content };
}

async function getForge() {
  try {
    return await import("@forge/api");
  } catch (e) {
    return null;
  }
}

async function resolveRequestJira(deps) {
  if (deps && typeof deps.requestJira === "function") return deps.requestJira;
  const forge = await getForge();
  if (forge && typeof forge.asApp === "function") {
    const app = forge.asApp();
    return (url, init) => app.requestJira(url, init);
  }
  if (forge && typeof forge.requestJira === "function") return forge.requestJira;
  // Fallback no-op for non-Forge/test environments.
  return async () => ({ ok: true, status: 200, json: async () => ({}) });
}

async function resolveRoute(deps) {
  if (deps && typeof deps.route === "function") return deps.route;
  const forge = await getForge();
  if (forge && typeof forge.route === "function") return forge.route;
  // Fallback template tag.
  return (strings, ...values) => strings.reduce((acc, s, i) => acc + s + (i < values.length ? encodeURIComponent(String(values[i])) : ""), "");
}

export async function handleIssueCreated(event, deps = {}) {
  const d = deps || {};
  const checkConflictFn = typeof d.checkConflict === "function" ? d.checkConflict : checkConflict;
  const getDecisionFn = typeof d.getDecision === "function" ? d.getDecision : getDecision;

  const ev = (event && event.payload) ? event.payload : (event || {});

  // Loop guard: ignore comments authored by the app.
  if (ev.comment && isOwnComment(ev.comment, d.appAccountId)) {
    return { skipped: true, reason: "own comment" };
  }

  const issue = extractIssueText(ev);
  const proposed = [issue.summary, issue.description].filter(Boolean).join("\n\n").trim();
  if (!proposed) {
    return { skipped: true, reason: "no text" };
  }

  const result = await checkConflictFn({ proposedChange: proposed });

  if (!result || !result.conflicts) {
    return { conflicts: false, reason: result && result.reason };
  }

  let decision = null;
  if (result.decisionId) {
    try {
      decision = await getDecisionFn(result.decisionId);
    } catch (e) {
      decision = null;
    }
  }

  const requestJira = await resolveRequestJira(d);
  const route = await resolveRoute(d);
  const issueIdOrKey = issue.key || issue.id;

  let posted = false;
  let status = null;
  try {
    const res = await requestJira(route`/rest/api/3/issue/${issueIdOrKey}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: buildAdf(result.reason, decision) }),
    });
    posted = !!(res && (res.ok === true || (typeof res.status === "number" && res.status >= 200 && res.status < 300)));
    status = res && res.status;
  } catch (e) {
    posted = false;
    status = null;
  }

  return { conflicts: true, posted, status, decisionId: result.decisionId };
}

export const run = async (req, deps) => {
  const event = (req && req.payload) ? req.payload : (req || {});
  const d = (deps && typeof deps === "object") ? deps : (req && req.deps) || {};
  return handleIssueCreated(event, d);
};

export default run;
