import React, { useState, useEffect } from "react";
import { view } from "@forge/bridge";
import DecisionHealth from "./DecisionHealth";
import DecisionMap from "./DecisionMap";
import Timeline from "./Timeline";

type Tab = "health" | "map" | "timeline";

export default function ProjectPage() {
  const [tab, setTab] = useState<Tab>("health");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { (view as any)?.theme?.enable?.(); } catch {}
    setReady(true);
  }, []);

  if (!ready) return <div style={{ padding: 12 }}>Loading...</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "health", label: "Decision Health" },
    { id: "map", label: "Decision Map" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div style={{ padding: 12, fontFamily: "var(--ds-font-family, sans-serif)", color: "var(--ds-text, #172b4d)" }}>
      <h2 style={{ margin: "0 0 12px" }}>Engram</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, borderBottom: "1px solid var(--ds-border, #dfe1e6)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "6px 12px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderBottom: tab === t.id ? "2px solid var(--ds-primary, #0052cc)" : "2px solid transparent",
              fontWeight: tab === t.id ? 600 : 400,
              color: "var(--ds-text, #172b4d)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "health" && <DecisionHealth />}
      {tab === "map" && <DecisionMap />}
      {tab === "timeline" && <Timeline />}
    </div>
  );
}