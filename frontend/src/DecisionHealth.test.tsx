import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import DecisionHealth from "./DecisionHealth";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@forge/bridge", () => ({ invoke }));

describe("DecisionHealth", () => {
  afterEach(() => cleanup());
  beforeEach(() => invoke.mockReset());

  it("renders metrics from decisions", async () => {
    const now = new Date();
    const old = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 200).toISOString();
    invoke.mockImplementation(async (name: string) => {
      if (name === "listDecisions") {
        return [
          { id: "1", title: "A", status: "active", decidedAt: now.toISOString() },
          { id: "2", title: "B", status: "superseded", decidedAt: now.toISOString() },
          { id: "3", title: "C", status: "active", decidedAt: old },
        ];
      }
      if (name === "getContradictionCount") return 2;
      return [];
    });
    render(<DecisionHealth />);
    await waitFor(() => expect(screen.getByTestId("total-decisions")).toBeTruthy());
    expect(screen.getByTestId("total-decisions").textContent).toContain("3");
    expect(screen.getByTestId("active-count").textContent).toContain("2");
    expect(screen.getByTestId("superseded-count").textContent).toContain("1");
    expect(screen.getByTestId("stale-count").textContent).toContain("1");
    expect(screen.getByTestId("contradictions-caught").textContent).toContain("2");
    expect(screen.getByTestId("hours-saved").textContent).toContain("6");
  });

  it("shows empty state when no decisions", async () => {
    invoke.mockResolvedValue([]);
    render(<DecisionHealth />);
    await waitFor(() => expect(screen.getByText(/No decisions recorded yet/)).toBeTruthy());
  });
});