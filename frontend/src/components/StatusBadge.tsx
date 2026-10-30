import React from "react";

export default function StatusBadge({ status }: { status: string }) {
  const color =
    status === "active"
      ? "var(--ds-text-success, #00875a)"
      : status === "superseded"
      ? "var(--ds-text-danger, #de350b)"
      : "var(--ds-text-warning, #ff8b00)";
  return (
    <span
      data-testid="status-badge"
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        background: color,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}
