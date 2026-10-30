import { MOCK_DECISIONS, mockCheckConflict } from "./mockData";
import type { Decision } from "./mockData";

async function bridge(): Promise<{ getContext?: () => Promise<any>; invoke?: (k: string, p?: any) => Promise<any> } | null> {
  try {
    return await import("@forge/bridge");
  } catch (e) {
    return null;
  }
}

export async function readIssueContext(): Promise<{ summary: string; description: string }> {
  try {
    const b = await bridge();
    const getContext = b?.getContext;
    if (getContext) {
      const ctx: any = await getContext();
      const ext = ctx?.extension || {};
      const issue = ext?.issue || ext || {};
      const summary = issue?.summary || ext?.summary || "";
      const description =
        issue?.description || ext?.description || (typeof ext?.content === "string" ? ext.content : "");
      if (summary || description) return { summary, description };
    }
  } catch (e) {
    // not in Forge runtime (tests/dev) -> fall back to mock
  }
  return {
    summary: "Switch to MongoDB for orders",
    description: "Proposal to migrate the orders collection to MongoDB for flexibility.",
  };
}

export async function searchDecisions(keywords: string[], tags: string[] = []): Promise<Decision[]> {
  try {
    const b = await bridge();
    const invoke = b?.invoke;
    if (invoke) {
      const res: any = await invoke("searchDecisionsResolver", { keywords, tags });
      if (Array.isArray(res)) return res as Decision[];
      if (Array.isArray(res?.decisions)) return res.decisions as Decision[];
    }
  } catch (e) {
    // fall back to mock
  }
  // mock: simple keyword scoring against mock data
  const kw = keywords.map((k) => k.toLowerCase());
  const scored = MOCK_DECISIONS.map((d) => {
    const hay = (d.title + " " + d.summary + " " + d.reasoning + " " + d.tags.join(" ")).toLowerCase();
    const score = kw.reduce((acc, k) => (hay.includes(k) ? acc + 1 : acc), 0);
    return { d, score };
  }).sort((a, b) => b.score - a.score);

  const result: Decision[] = [];
  for (const x of scored) {
    if (result.length >= 3) break;
    result.push(x.d);
  }
  // pad to 3 if needed
  for (const d of MOCK_DECISIONS) {
    if (result.length >= 3) break;
    if (!result.find((r) => r.id === d.id)) result.push(d);
  }
  return result;
}

export async function checkConflict(proposedChange: string, decisionId: string): Promise<{ conflicts: boolean; reason: string; decisionId?: string }> {
  try {
    const b = await bridge();
    const invoke = b?.invoke;
    if (invoke) {
      const res: any = await invoke("checkConflict", { proposedChange });
      if (res && typeof res === "object") return res;
    }
  } catch (e) {
    // fall back to mock
  }
  return mockCheckConflict(decisionId);
}
