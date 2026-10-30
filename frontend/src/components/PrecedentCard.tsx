import React from "react";
import StatusBadge from "./StatusBadge";
import type { Decision } from "../mockData";

export default function PrecedentCard({
  decision,
  conflict,
}: {
  decision: Decision;
  conflict?: { conflicts: boolean; reason: string };
}) {
  return (
    <div
      data-testid="precedent-card"
      style={{
        border: "1px solid var(--ds-border, #dfe1e6)",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        background: "var(--ds-surface, #fff)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            padding: 8,
            borderRadius: 6,
            background: "var(--ds-background-danger, #ffebe6)",
            color: "var(--ds-text-danger, #de350b)",
            fontSize: 13,
          }}
        >
          Possible conflict: {conflict.reason}
        </div>
      )}
    </div>
  );
}
