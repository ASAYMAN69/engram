import React, { useState } from "react";
import { invoke } from "@forge/bridge";
import type { Decision } from "./types";

const EMPTY_DRAFT: Decision = {
  id: "",
  title: "",
  summary: "",
  reasoning: "",
  alternativesRejected: [],
  decidedBy: "",
  decidedAt: new Date().toISOString(),
  status: "active",
  tags: [],
  sourceUrl: "",
  sourceType: "manual",
};

interface LogDecisionProps {
  text?: string;
  onSaved?: (decision: Decision) => void;
}

async function invokeSave(decision: Decision) {
  const names = ["saveDecision", "saveDecisionResolver", "saveDecisionResolver"];
  let lastErr: unknown;
  for (const name of names) {
    try {
      return await invoke(name, { decision });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Failed to save decision");
}

export default function LogDecision({ text = "", onSaved }: LogDecisionProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLog() {
    setLoading(true);
    setError(null);
    try {
      const res = await invoke<any>("extractDecision", { text });
      const d = (res && (res.decision ?? res)) || {};
      setDraft({
        ...EMPTY_DRAFT,
        ...d,
        alternativesRejected: Array.isArray(d.alternativesRejected)
          ? d.alternativesRejected
          : typeof d.alternativesRejected === "string"
          ? d.alternativesRejected.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        tags: Array.isArray(d.tags)
          ? d.tags
          : typeof d.tags === "string"
          ? d.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        decidedAt: d.decidedAt || new Date().toISOString(),
        status: d.status || "active",
      });
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract decision");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof Decision>(key: K, value: Decision[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Decision = {
        ...draft,
        alternativesRejected: Array.isArray(draft.alternativesRejected)
          ? draft.alternativesRejected
          : String(draft.alternativesRejected)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
        tags: Array.isArray(draft.tags)
          ? draft.tags
          : String(draft.tags)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
      };
      await invokeSave(payload);
      onSaved?.(payload);
      setOpen(false);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: "var(--ds-space-100, 8px)" }}>
      <button
        type="button"
        onClick={() => { handleLog().catch(() => {}); }}
        disabled={loading}
        style={{
          padding: "var(--ds-space-100, 8px) var(--ds-space-200, 12px)",
          borderRadius: "var(--ds-border-radius-200, 6px)",
          border: "1px solid var(--ds-border, #dfe1e6)",
          background: "var(--ds-background-brand-bold, #0052cc)",
          color: "var(--ds-text-inverse, #ffffff)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Extracting..." : "Log this decision"}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "var(--ds-space-100, 8px)",
            color: "var(--ds-text-danger, #de350b)",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {open && draft && (
        <form
          onSubmit={handleSave}
          style={{
            marginTop: "var(--ds-space-200, 12px)",
            padding: "var(--ds-space-200, 12px)",
            border: "1px solid var(--ds-border, #dfe1e6)",
            borderRadius: "var(--ds-border-radius-200, 6px)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ds-space-100, 8px)",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Title</span>
            <input
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              style={{ padding: 6 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Summary</span>
            <textarea
              value={draft.summary}
              onChange={(e) => update("summary", e.target.value)}
              rows={3}
              style={{ padding: 6 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Reasoning</span>
            <textarea
              value={draft.reasoning}
              onChange={(e) => update("reasoning", e.target.value)}
              rows={3}
              style={{ padding: 6 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Alternatives rejected (comma separated)</span>
            <input
              value={draft.alternativesRejected.join(", ")}
              onChange={(e) =>
                update(
                  "alternativesRejected",
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                )
              }
              style={{ padding: 6 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Decided by</span>
            <input
              value={draft.decidedBy}
              onChange={(e) => update("decidedBy", e.target.value)}
              style={{ padding: 6 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Tags (comma separated)</span>
            <input
              value={draft.tags.join(", ")}
              onChange={(e) =>
                update(
                  "tags",
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                )
              }
              style={{ padding: 6 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Source URL</span>
            <input
              value={draft.sourceUrl}
              onChange={(e) => update("sourceUrl", e.target.value)}
              style={{ padding: 6 }}
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "6px 12px",
                background: "var(--ds-background-brand-bold, #0052cc)",
                color: "var(--ds-text-inverse, #ffffff)",
                border: "none",
                borderRadius: "var(--ds-border-radius-200, 6px)",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setDraft(null);
              }}
              style={{
                padding: "6px 12px",
                border: "1px solid var(--ds-border, #dfe1e6)",
                borderRadius: "var(--ds-border-radius-200, 6px)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}