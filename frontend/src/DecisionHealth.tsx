import React, { useEffect, useState, useMemo } from "react";
import { invoke } from "@forge/bridge";
import StatusBadge from "./components/StatusBadge";
import type { Decision } from "./types";

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;

async function loadDecisions(): Promise<Decision[]> {
  const candidates = ["listDecisions", "listDecisionsResolver", "getDecisions", "listDecisionsResolver"];
  let lastErr: unknown;
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
      return list as Decision[];
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Failed to load decisions");
}

async function loadContradictions(): Promise<number | null> {
  const candidates = ["getContradictionCount", "getContradictionsCaught", "contradictionsCaught"];
  for (const name of candidates) {
    try {
      const res = await invoke<any>(name);
      if (typeof res === "number") return res;
      if (typeof res?.count === "number") return res.count;
      if (typeof res?.contradictions === "number") return res.contradictions;
      if (typeof res?.value === "number") return res.value;
    } catch {
      // try next
    }
  }
  return null;
}

function isStale(d: Decision): boolean {
  if (d.status === "revisited") return false;
  const decided = new Date(d.decidedAt).getTime();
  if (Number.isNaN(decided)) return false;
  return Date.now() - decided > SIX_MONTHS_MS;
}

export default function DecisionHealth() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [contradictions, setContradictions] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await loadDecisions();
        setDecisions(list);
        const c = await loadContradictions();
        if (c !== null) {
          setContradictions(c);
        } else {
          setContradictions(list.filter((d) => d.status === "superseded").length);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load decisions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = decisions.length;
  const active = decisions.filter((d) => d.status === "active").length;
  const superseded = decisions.filter((d) => d.status === "superseded").length;
  const revisited = decisions.filter((d) => d.status === "revisited").length;
  const stale = decisions.filter(isStale).length;
  const hoursSaved = contradictions * 3;

  const chartData = [
    { label: "Active", value: active, color: "var(--ds-background-success-bold, #36b37e)" },
    { label: "Superseded", value: superseded, color: "var(--ds-background-neutral, #6b778c)" },
    { label: "Revisited", value: revisited, color: "var(--ds-background-warning-bold, #ff991f)" },
    { label: "Stale", value: stale, color: "var(--ds-background-danger-bold, #de350b)" },
  ];
  const max = Math.max(1, ...chartData.map((d) => d.value));

  // decisions over time (by month)
  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of decisions) {
      const dt = new Date(d.decidedAt);
      if (Number.isNaN(dt.getTime())) continue;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-8);
  }, [decisions]);
  const monthMax = Math.max(1, ...byMonth.map(([, v]) => v));

  // tag heatmap
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of decisions) {
      for (const t of d.tags ?? []) {
        map.set(t, (map.get(t) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [decisions]);
  const tagMax = Math.max(1, ...tagCounts.map(([, v]) => v));

  // most cited = most tags (proxy) then recent
  const mostCited = useMemo(() => {
    return [...decisions]
      .sort((a, b) => (b.tags?.length ?? 0) - (a.tags?.length ?? 0) || new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime())
      .slice(0, 5);
  }, [decisions]);

  if (loading) {
    return (
      <div style={{ padding: 16 }} data-testid="loading-state">
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" style={{ padding: 16, color: "var(--ds-text-danger, #de350b)" }}>
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "var(--ds-space-300, 24px)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--ds-space-200, 16px)",
      }}
    >
      <h2 style={{ margin: 0 }}>Decision Health</h2>

      {/* Hero hours saved */}
      <div
        className="animate-in"
        style={{
          padding: "var(--ds-space-300, 24px)",
          borderRadius: "var(--ds-border-radius-300, 8px)",
          background: "linear-gradient(135deg, var(--ds-background-brand-bold, #0052cc), var(--ds-background-success-bold, #36b37e))",
          color: "var(--ds-text-inverse, #ffffff)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
        data-testid="hero-hours-saved"
      >
        <span style={{ fontSize: 12, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>Estimated hours saved</span>
        <span className="countup" style={{ fontSize: 48, fontWeight: 800 }}>{hoursSaved}</span>
        <span style={{ fontSize: 12, opacity: 0.9 }}>from {contradictions} contradictions caught (3h each)</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--ds-space-200, 16px)",
        }}
      >
        <MetricCard label="Total decisions" value={total} testId="total-decisions" />
        <MetricCard label="Active" value={active} testId="active-count" />
        <MetricCard label="Superseded" value={superseded} testId="superseded-count" />
        <MetricCard label="Stale (>6mo)" value={stale} testId="stale-count" />
        <MetricCard label="Contradictions caught" value={contradictions} testId="contradictions-caught" />
        <MetricCard
          label="Est. hours saved"
          value={hoursSaved}
          testId="hours-saved"
          footnote="estimate: 3h per contradiction"
        />
      </div>

      {/* Status breakdown */}
      <div
        style={{
          padding: "var(--ds-space-200, 16px)",
          border: "1px solid var(--ds-border, #dfe1e6)",
          borderRadius: "var(--ds-border-radius-200, 6px)",
          background: "var(--ds-surface, #fff)",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Status breakdown</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 160 }}>
          {chartData.map((d) => (
            <div
              key={d.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                className="bar"
                style={{
                  width: "100%",
                  height: `${(d.value / max) * 120}px`,
                  background: d.color,
                  borderRadius: 4,
                  minHeight: d.value > 0 ? 4 : 0,
                }}
              />
              <span style={{ fontSize: 12 }}>{d.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decisions over time */}
      <div
        style={{
          padding: "var(--ds-space-200, 16px)",
          border: "1px solid var(--ds-border, #dfe1e6)",
          borderRadius: "var(--ds-border-radius-200, 6px)",
          background: "var(--ds-surface, #fff)",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Decisions over time</h3>
        {byMonth.length === 0 ? (
          <div style={{ color: "var(--ds-text-subtle, #6b778c)", fontSize: 13 }}>No data yet.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
            {byMonth.map(([label, v]) => (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div className="bar" style={{ width: "100%", height: `${(v / monthMax) * 100}px`, background: "var(--ds-background-brand-bold, #0052cc)", borderRadius: 4, minHeight: 4 }} />
                <span style={{ fontSize: 10 }}>{label.slice(5)}</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tag heatmap */}
      <div
        style={{
          padding: "var(--ds-space-200, 16px)",
          border: "1px solid var(--ds-border, #dfe1e6)",
          borderRadius: "var(--ds-border-radius-200, 6px)",
          background: "var(--ds-surface, #fff)",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Tag heatmap</h3>
        {tagCounts.length === 0 ? (
          <div style={{ color: "var(--ds-text-subtle, #6b778c)", fontSize: 13 }}>No tags yet.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tagCounts.map(([tag, count]) => {
              const intensity = count / tagMax;
              const bg = `rgba(0, 82, 204, ${0.15 + intensity * 0.7})`;
              return (
                <div
                  key={tag}
                  className="heatmap-cell"
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: bg,
                    color: intensity > 0.5 ? "#fff" : "var(--ds-text, #172b4d)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  title={`${tag}: ${count}`}
                >
                  {tag} · {count}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Most cited */}
      <div
        style={{
          padding: "var(--ds-space-200, 16px)",
          border: "1px solid var(--ds-border, #dfe1e6)",
          borderRadius: "var(--ds-border-radius-200, 6px)",
          background: "var(--ds-surface, #fff)",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Most cited decisions</h3>
        {mostCited.length === 0 ? (
          <div style={{ color: "var(--ds-text-subtle, #6b778c)", fontSize: 13 }}>No decisions yet.</div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {mostCited.map((d) => (
              <li
                key={d.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  border: "1px solid var(--ds-border, #dfe1e6)",
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</span>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {total === 0 && (
        <div
          style={{
            padding: "var(--ds-space-200, 16px)",
            color: "var(--ds-text-subtle, #6b778c)",
            textAlign: "center",
          }}
        >
          No decisions recorded yet. Log your first decision to see health metrics.
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  testId,
  footnote,
}: {
  label: string;
  value: number;
  testId: string;
  footnote?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="animate-in"
      style={{
        padding: "var(--ds-space-200, 16px)",
        border: "1px solid var(--ds-border, #dfe1e6)",
        borderRadius: "var(--ds-border-radius-200, 6px)",
        background: "var(--ds-surface, #fff)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--ds-text-subtle, #6b778c)" }}>{label}</span>
      <span className="countup" style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
      {footnote && (
        <span style={{ fontSize: 10, color: "var(--ds-text-subtle, #6b778c)" }}>{footnote}</span>
      )}
    </div>
  );
}