import React from "react";

export default function LoadingState() {
  return (
    <div data-testid="loading-state" aria-busy="true" aria-label="Loading relevant precedents">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            border: "1px solid var(--ds-border, #dfe1e6)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            background: "var(--ds-surface, #fff)",
          }}
        >
          <div className="skeleton" style={{ height: 16, width: "60%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: "90%", marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 12, width: "75%" }} />
        </div>
      ))}
    </div>
  );
}