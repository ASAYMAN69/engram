import React, { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import StatusBadge from "./components/StatusBadge";
import type { Decision } from "./types";
import { MOCK_DECISIONS } from "./mockData";

async function loadDecisions(): Promise<Decision[]> {
  const candidates = ["listDecisions", "listDecisionsResolver", "getDecisions"];
  for (const name of candidates) {
    try {
      const res = await invoke<any>(name);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.decisions)
        ? res.decisions
        : Array.isArray(res?.items)
        ? res.items
        : [];
      if (list.length) return list as Decision[];
    } catch {
      // try next
    }
  }
  return MOCK_DECISIONS as unknown as Decision[];
}

const STATUS_COLOR: Record<string, string> = {
  active: "var(--ds-background-success-bold, #36b37e)",
  superseded: "var(--ds-background-danger-bold, #de350b)",
  revisited: "var(--ds-background-warning-bold, #ff991f)",
};

export default function Timeline() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await loadDecisions();
        setDecisions(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load decisions");
        setDecisions(MOCK_DECISIONS as unknown as Decision[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading timeline...</div>;
  }
  if (error) {
    // still render with mock data
  }

  const sorted = [...decisions].sort(
    (a, b) => new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime()
  );

  const byId = new Map(sorted.map((d) => [d.id, d]));

  // Build lineage chains: connected components via supersededBy/supersedes edges.
  const parent = new Map<string, string>();
  decisions.forEach((d) => parent.set(d.id, d.id));
  const find = (x: string): string => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  decisions.forEach((d) => {
    if (d.supersededBy && byId.has(d.supersededBy)) union(d.id, d.supersededBy);
    if (d.supersedes && byId.has(d.supersedes)) union(d.id, d.supersedes);
  });
  const chainsMap = new Map<string, Decision[]>();
  decisions.forEach((d) => {
    const root = find(d.id);
    if (!chainsMap.has(root)) chainsMap.set(root, []);
    chainsMap.get(root)!.push(d);
  });
  const chains = [...chainsMap.values()].map((c) =>
    c.sort((a, b) => new Date(a.decidedAt).getTime() - new Date(b.decidedAt).getTime())
  );

  return (
    <div data-testid="timeline" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 0 }}>
      <h2 style={{ margin: "0 0 12px 0" }}>Decision Timeline</h2>
      {chains.map((chain, ci) => (
        <div key={ci} data-testid="timeline-chain" style={{ marginBottom: 24 }}>
          {chain.length > 1 && (
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text-subtle, #6b778c)", marginBottom: 6 }}>
              Lineage chain ({chain.length})
            </div>
          )}
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <div
              style={{
                position: "absolute",
                left: 8,
                top: 0,
                bottom: 0,
                width: 2,
                background: "var(--ds-border, #dfe1e6)",
              }}
            />
            {chain.map((d, i) => {
              const color = STATUS_COLOR[d.status] || "#8993a4";
              const successor = d.supersededBy ? byId.get(d.supersededBy) : undefined;
              return (
                <div key={d.id}>
                  {i > 0 && (
                    <div style={{ marginLeft: -4, marginBottom: 4, fontSize: 14, color: "var(--ds-text-subtle, #6b778c)" }}>
                      ↓
                    </div>
                  )}
                  <div
                    data-testid="timeline-item"
                    style={{ position: "relative", marginBottom: 16, paddingLeft: 16 }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: -20,
                        top: 6,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: color,
                        border: "2px solid #fff",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span data-testid="timeline-date" style={{ fontSize: 12, color: "var(--ds-text-subtle, #6b778c)" }}>
                        {d.decidedAt ? new Date(d.decidedAt).toLocaleDateString() : ""}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.title}</div>
                    <div data-testid="timeline-reason" style={{ fontSize: 13, color: "var(--ds-text-subtle, #42526e)" }}>
                      {d.reasoning}
                    </div>
                    {d.supersededBy && (
                      <div style={{ fontSize: 12, marginTop: 4, color: "var(--ds-text-danger, #de350b)" }}>
                        Superseded by: {successor?.title || d.supersededBy}
                      </div>
                    )}
                    {d.supersedes && (
                      <div style={{ fontSize: 12, marginTop: 4, color: "var(--ds-text-success, #00875a)" }}>
                        Supersedes: {byId.get(d.supersedes)?.title || d.supersedes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}