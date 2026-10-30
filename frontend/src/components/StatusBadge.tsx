import React from "react";

const COLORS: Record<string, { bg: string; fg: string }> = {
  active: { bg: "var(--ds-background-success-bold, #36b37e)", fg: "#ffffff" },
  superseded: { bg: "var(--ds-background-neutral, #6b778c)", fg: "#ffffff" },
  revisited: { bg: "var(--ds-background-warning-bold, #ff991f)", fg: "#172b4d" },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = COLORS[status] ?? { bg: "var(--ds-background-neutral, #6b778c)", fg: "#ffffff" };
  return (
    <span
      data-testid="status-badge"
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}