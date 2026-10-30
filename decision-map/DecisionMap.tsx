import React, { useEffect, useMemo, useState } from "react";

type DecisionStatus = "active" | "superseded" | "revisited";

interface LocalDecision {
  id: string;
  title: string;
  summary: string;
  reasoning: string;
  alternativesRejected: string[];
  decidedBy: string;
  decidedAt: string;
  status: DecisionStatus;
  tags: string[];
  sourceUrl: string;
  sourceType: string;
}

type AnyDecision = LocalDecision;

interface Props {
  decisions?: AnyDecision[];
  onSelect?: (d: AnyDecision) => void;
  width?: number;
  height?: number;
}

const STATUS_COLOR: Record<string, string> = {
  active: "var(--ds-background-success-bold, #36b37e)",
  superseded: "var(--ds-background-warning-bold, #ff991f)",
  revisited: "var(--ds-background-discovery-bold, #6554c0)",
};

async function loadDecisions(): Promise<AnyDecision[]> {
  // Try forge bridge.
  try {
    const b: any = await import("@forge/bridge");
    const invoke = b?.invoke;
    if (invoke) {
      const candidates = ["listDecisions", "searchDecisionsResolver", "getDecisions"];
      for (const name of candidates) {
        try {
          const res = await invoke(name, name === "searchDecisionsResolver" ? {} : undefined);
          const list = Array.isArray(res)
            ? res
            : Array.isArray(res?.decisions)
            ? res.decisions
            : Array.isArray(res?.items)
            ? res.items
            : [];
          if (list.length >= 0) return list as AnyDecision[];
        } catch {
          // try next
        }
      }
    }
  } catch {
    // not in forge runtime
  }
  // Mock fallback (mirrors frontend mock data)
  return [
    { id: "dec-001", title: "Use PostgreSQL for orders data", summary: "Orders and payments stored in PostgreSQL.", reasoning: "Strong consistency.", alternativesRejected: ["MongoDB", "DynamoDB"], decidedBy: "alice", decidedAt: "2025-09-01", status: "active", tags: ["database", "orders"], sourceUrl: "https://jira.example.com/browse/ORD-12", sourceType: "jira" },
    { id: "dec-002", title: "Redis caching for menu reads", summary: "Cache menu catalog in Redis with 5m TTL.", reasoning: "Reduces DB load.", alternativesRejected: ["in-memory", "memcached"], decidedBy: "bob", decidedAt: "2025-08-15", status: "active", tags: ["caching", "menu"], sourceUrl: "https://confluence.example.com/pages/123", sourceType: "confluence" },
    { id: "dec-003", title: "JWT auth via Auth0", summary: "Authentication handled by Auth0 with JWTs.", reasoning: "Offloads auth.", alternativesRejected: ["custom JWT", "Firebase Auth"], decidedBy: "carol", decidedAt: "2025-07-20", status: "superseded", tags: ["auth"], sourceUrl: "https://jira.example.com/browse/AUTH-3", sourceType: "jira" },
  ];
}

function buildEdges(decisions: AnyDecision[]): { from: string; to: string }[] {
  const edges: { from: string; to: string }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < decisions.length; i++) {
    for (let j = i + 1; j < decisions.length; j++) {
      const a = decisions[i];
      const b = decisions[j];
      const sharedTag = (a.tags || []).some((t) => (b.tags || []).includes(t));
      const sharedPerson = !!a.decidedBy && a.decidedBy === b.decidedBy;
      if (sharedTag || sharedPerson) {
        const key = [a.id, b.id].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          edges.push({ from: a.id, to: b.id });
        }
      }
    }
  }
  return edges;
}

function layout(decisions: AnyDecision[], w: number, h: number): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  const n = decisions.length;
  // initial circle
  decisions.forEach((d, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, n);
    const r = Math.min(w, h) * 0.35;
    pos[d.id] = { x: w / 2 + r * Math.cos(angle), y: h / 2 + r * Math.sin(angle) };
  });
  const edges = buildEdges(decisions);
  // simple force iterations
  const iters = 60;
  for (let t = 0; t < iters; t++) {
    // repulsion
    for (let i = 0; i < decisions.length; i++) {
      for (let j = i + 1; j < decisions.length; j++) {
        const a = decisions[i].id;
        const b = decisions[j].id;
        const dx = pos[a].x - pos[b].x;
        const dy = pos[a].y - pos[b].y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const force = 800 / (dist * dist);
        pos[a].x += (dx / dist) * force;
        pos[a].y += (dy / dist) * force;
        pos[b].x -= (dx / dist) * force;
        pos[b].y -= (dy / dist) * force;
      }
    }
    // attraction along edges
    for (const e of edges) {
      const a = pos[e.from];
      const b = pos[e.to];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const force = (dist - 120) * 0.02;
      a.x += (dx / dist) * force;
      a.y += (dy / dist) * force;
      b.x -= (dx / dist) * force;
      b.y -= (dy / dist) * force;
    }
    // center gravity
    for (const d of decisions) {
      pos[d.id].x += (w / 2 - pos[d.id].x) * 0.01;
      pos[d.id].y += (h / 2 - pos[d.id].y) * 0.01;
    }
    // clamp
    for (const d of decisions) {
      pos[d.id].x = Math.max(40, Math.min(w - 40, pos[d.id].x));
      pos[d.id].y = Math.max(40, Math.min(h - 40, pos[d.id].y));
    }
  }
  return pos;
}

export default function DecisionMap({ decisions: propDecisions, onSelect, width = 720, height = 480 }: Props) {
  const [decisions, setDecisions] = useState<AnyDecision[]>(propDecisions || []);
  const [loading, setLoading] = useState(!propDecisions);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (propDecisions) {
      setDecisions(propDecisions);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await loadDecisions();
        if (cancelled) return;
        setDecisions(list);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load decisions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propDecisions]);

  const pos = useMemo(() => layout(decisions, width, height), [decisions, width, height]);
  const edges = useMemo(() => buildEdges(decisions), [decisions]);
  const selected = useMemo(() => decisions.find((d) => d.id === selectedId) || null, [decisions, selectedId]);

  function handleNodeClick(d: AnyDecision) {
    setSelectedId(d.id);
    onSelect?.(d);
  }

  if (loading) {
    return (
      <div data-testid="decision-map" style={{ padding: 16, color: "var(--ds-text, #172b4d)" }}>
        Loading decision map...
      </div>
    );
  }
  if (error) {
    return (
      <div data-testid="decision-map" role="alert" style={{ padding: 16, color: "var(--ds-text-danger, #de350b)" }}>
        {error}
      </div>
    );
  }

  return (
    <div
      data-testid="decision-map"
      style={{
        display: "flex",
        gap: "var(--ds-space-200, 16px)",
        padding: "var(--ds-space-200, 16px)",
        color: "var(--ds-text, #172b4d)",
        fontFamily: "var(--ds-font-family, sans-serif)",
      }}
    >
      <div
        data-testid="decision-graph"
        style={{
          flex: 1,
          position: "relative",
          border: "1px solid var(--ds-border, #dfe1e6)",
          borderRadius: "var(--ds-border-radius-200, 6px)",
          background: "var(--ds-background-neutral, transparent)",
          overflow: "hidden",
        }}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
          {edges.map((e, i) => {
            const a = pos[e.from];
            const b = pos[e.to];
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--ds-border, #dfe1e6)"
                strokeWidth={1.5}
                opacity={0.6}
              />
            );
          })}
          {decisions.map((d) => {
            const p = pos[d.id];
            if (!p) return null;
            const color = STATUS_COLOR[d.status] || "var(--ds-background-neutral-bold, #97a0af)";
            const selected = d.id === selectedId;
            return (
              <g
                key={d.id}
                data-testid={`decision-node-${d.id}`}
                transform={`translate(${p.x},${p.y})`}
                onClick={() => handleNodeClick(d)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  data-testid="decision-node"
                  r={selected ? 16 : 12}
                  fill={color}
                  stroke={selected ? "var(--ds-text, #172b4d)" : "var(--ds-background-neutral, #ffffff)"}
                  strokeWidth={selected ? 3 : 2}
                />
                <text
                  y={26}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--ds-text, #172b4d)"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {d.title.length > 22 ? d.title.slice(0, 20) + "…" : d.title}
                </text>
              </g>
            );
          })}
        </svg>
        {decisions.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ds-text-subtle, #6b778c)" }}>
            No decisions recorded yet.
          </div>
        )}
      </div>

      <aside
        data-testid="decision-details"
        style={{
          width: 320,
          minWidth: 260,
          border: "1px solid var(--ds-border, #dfe1e6)",
          borderRadius: "var(--ds-border-radius-200, 6px)",
          padding: "var(--ds-space-200, 16px)",
          background: "var(--ds-background-neutral, transparent)",
          overflow: "auto",
          maxHeight: height,
        }}
      >
        {!selected && (
          <div style={{ color: "var(--ds-text-subtle, #6b778c)" }}>
            Click a decision node to view details.
          </div>
        )}
        {selected && (
          <div data-testid="decision-detail-content">
            <h3 style={{ margin: "0 0 8px" }}>{selected.title}</h3>
            <div style={{ marginBottom: 8 }}>
              <StatusBadge status={selected.status} />
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 13 }}>{selected.summary}</p>
            {selected.reasoning && (
              <section style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: 12 }}>Reasoning</strong>
                <p style={{ margin: "4px 0", fontSize: 13 }}>{selected.reasoning}</p>
              </section>
            )}
            {selected.alternativesRejected?.length > 0 && (
              <section style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: 12 }}>Alternatives rejected</strong>
                <ul style={{ margin: "4px 0", paddingLeft: 18, fontSize: 13 }}>
                  {selected.alternativesRejected.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}
            <div style={{ fontSize: 12, color: "var(--ds-text-subtle, #6b778c)" }}>
              <div>Decided by: {selected.decidedBy}</div>
              <div>Decided at: {selected.decidedAt}</div>
              {selected.tags?.length > 0 && <div>Tags: {selected.tags.join(", ")}</div>}
              {selected.sourceUrl && (
                <div>
                  Source:{" "}
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                    {selected.sourceUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// Inline status badge to avoid external import issues.
function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || "var(--ds-background-neutral-bold, #97a0af)";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        color: "#fff",
        background: color,
      }}
    >
      {status}
    </span>
  );
}