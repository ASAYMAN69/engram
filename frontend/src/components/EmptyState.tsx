import React from "react";

export default function EmptyState() {
  return (
    <div
      data-testid="empty-state"
      style={{
        padding: 24,
        textAlign: "center",
        color: "var(--ds-text-subtle, #42526e)",
        border: "1px dashed var(--ds-border, #dfe1e6)",
        borderRadius: 8,
        background: "var(--ds-surface, #fff)",
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>No relevant precedents found.</div>
      <div style={{ fontSize: 13 }}>Log a decision to build your team's memory.</div>
    </div>
  );
}