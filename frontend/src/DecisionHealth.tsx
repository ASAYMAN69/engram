import React, { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
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
  const stale = decisions.filter(isStale).length;
  const hoursSaved = contradictions * 3;

  const chartData = [
    { label: "Active", value: active, color: "var(--ds-background-success-bold, #36b37e)" },
    { label: "Superseded", value: superseded, color: "var(--ds-background-warning-bold, #ff991f)" },
    { label: "Stale", value: stale, color: "var(--ds-background-danger-bold, #de350b)" },
  ];
  const max = Math.max(1, ...chartData.map((d) => d.value));

  if (loading) {
    return <div style={{ padding: 16 }}>Loading decision health...</div>;
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

      <div
        style={{
          marginTop: "var(--ds-space-200, 16px)",
          padding: "var(--ds-space-200, 16px)",
          border: "1px solid var(--ds-border, #dfe1e6)",
          borderRadius: "var(--ds-border-radius-200, 6px)",
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
      style={{
        padding: "var(--ds-space-200, 16px)",
        border: "1px solid var(--ds-border, #dfe1e6)",
        borderRadius: "var(--ds-border-radius-200, 6px)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--ds-text-subtle, #6b778c)" }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
      {footnote && (
        <span style={{ fontSize: 10, color: "var(--ds-text-subtle, #6b778c)" }}>{footnote}</span>
      )}
    </div>
  );
}