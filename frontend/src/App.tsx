import React, { useEffect, useState } from "react";
import { usePrecedents } from "./hooks/usePrecedents";
import { loadDemoData } from "./api";
import LoadingState from "./components/LoadingState";
import EmptyState from "./components/EmptyState";
import PrecedentCard from "./components/PrecedentCard";
import ProjectPage from "./ProjectPage";
import LogDecision from "./LogDecision";

export default function App() {
  const [isProjectPage, setIsProjectPage] = useState<boolean>(false);
  const [demoMsg, setDemoMsg] = useState<string>("");
  const [loadingDemo, setLoadingDemo] = useState(false);
  const { loading, matches, empty } = usePrecedents();

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await loadDemoData();
      setDemoMsg(`Loaded ${res.count} decisions.`);
      // reload page to refresh precedents
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setDemoMsg("Failed to load demo data.");
    } finally {
      setLoadingDemo(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (typeof window === "undefined") {
          if (!cancelled) setIsProjectPage(false);
          return;
        }
        const mod: any = await import("@forge/bridge");
        const v = mod?.view;
        if (!v || typeof v.getContext !== "function") {
          if (!cancelled) setIsProjectPage(false);
          return;
        }
        const ctx: any = await v.getContext();
        if (cancelled) return;
        const type = ctx?.extension?.type || ctx?.type || "";
        setIsProjectPage(String(type).includes("projectPage"));
      } catch {
        if (!cancelled) setIsProjectPage(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  if (isProjectPage === null) return <div style={{ padding: 12 }}>Loading...</div>;
  if (isProjectPage) return <ProjectPage />;

  return (
    <div style={{ padding: 12, fontFamily: "var(--ds-font-family, sans-serif)" }} className="card-hover-scope">
      <h3 style={{ margin: "0 0 8px", color: "var(--ds-text, #172b4d)" }}>Relevant Precedents</h3>
      {loading && <LoadingState />}
      {!loading && empty && <EmptyState />}
      {!loading &&
        matches.map((m) => (
          <PrecedentCard key={m.decision.id} decision={m.decision} proposed={m.proposed} conflict={m.conflict} />
        ))}
      <LogDecision />
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={handleLoadDemo} disabled={loadingDemo} style={{ padding: "6px 12px", cursor: "pointer" }}>
          {loadingDemo ? "Loading..." : "Load demo data"}
        </button>
        {demoMsg && <span style={{ fontSize: 12, color: "var(--ds-text-subtle, #6b778c)" }}>{demoMsg}</span>}
      </div>
    </div>
  );
}