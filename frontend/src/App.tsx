import React from "react";
import { usePrecedents } from "./hooks/usePrecedents";
import LoadingState from "./components/LoadingState";
import EmptyState from "./components/EmptyState";
import PrecedentCard from "./components/PrecedentCard";

export default function App() {
  const { loading, matches, empty } = usePrecedents();

  return (
    <div style={{ padding: 12, fontFamily: "var(--ds-font-family, sans-serif)" }} className="card-hover-scope">
      <h3 style={{ margin: "0 0 8px", color: "var(--ds-text, #172b4d)" }}>Relevant Precedents</h3>
      {loading && <LoadingState />}
      {!loading && empty && <EmptyState />}
      {!loading &&
        matches.map((m) => (
          <PrecedentCard key={m.decision.id} decision={m.decision} proposed={m.proposed} conflict={m.conflict} />
        ))}
    </div>
  );
}
