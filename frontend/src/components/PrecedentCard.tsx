import React from "react";
import StatusBadge from "./StatusBadge";
import type { Decision } from "../types";

export default function PrecedentCard({
  decision,
  proposed,
  conflict,
}: {
  decision: Decision;
  proposed?: string;
  conflict?: { conflicts: boolean; reason: string; decisionId?: string };
}) {
  return (
    <div
      data-testid="precedent-card"
      className="card-hover"
      style={{
        border: "1px solid var(--ds-border, #dfe1e6)",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        background: "var(--ds-surface, #fff)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <strong style={{ color: "var(--ds-text, #172b4d)" }}>{decision.title}</strong>
        <StatusBadge status={decision.status} />
      </div>
      <p style={{ margin: "6px 0", color: "var(--ds-text-subtle, #42526e)", fontSize: 13 }}>
        {decision.reasoning}
      </p>
      {decision.sourceUrl && (
        <a href={decision.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
          source
        </a>
      )}
      {conflict?.conflicts && (
        <div
          data-testid="conflict-warning"
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 6,
            background: "var(--ds-background-danger, #ffebe6)",
            color: "var(--ds-text-danger, #de350b)",
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠ Possible conflict</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ padding: 8, borderRadius: 4, background: "var(--ds-surface, #fff)", color: "var(--ds-text, #172b4d)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-text-subtle, #42526e)", marginBottom: 4 }}>
                This ticket says
              </div>
              <div style={{ fontSize: 12 }}>{proposed || "Proposed change"}</div>
            </div>
            <div style={{ padding: 8, borderRadius: 4, background: "var(--ds-surface, #fff)", color: "var(--ds-text, #172b4d)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-text-subtle, #42526e)", marginBottom: 4 }}>
                Decision says
              </div>
              <div style={{ fontSize: 12 }}>{decision.summary || decision.reasoning}</div>
            </div>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, fontStyle: "italic" }}>{conflict.reason}</div>
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <a data-testid="timeline-link" href="#timeline" style={{ fontSize: 12 }}>
          View Timeline
        </a>
      </div>
    </div>
  );
}