import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import LogDecision from "./LogDecision";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@forge/bridge", () => ({ invoke }));

describe("LogDecision", () => {
  afterEach(() => cleanup());
  beforeEach(() => invoke.mockReset());

  it("extracts and shows form, saves on confirm", async () => {
    invoke.mockImplementation(async (name: string) => {
      if (name === "extractDecision") {
        return { title: "Use Postgres", summary: "s", reasoning: "r", alternativesRejected: ["MySQL"], decidedBy: "me", tags: ["db"], sourceUrl: "u", sourceType: "ticket" };
      }
      if (name === "saveDecision") return { ok: true };
      return null;
    });
    const onSaved = vi.fn();
    render(<LogDecision text="some text" onSaved={onSaved} />);
    fireEvent.click(screen.getByText("Log this decision"));
    await waitFor(() => expect(screen.getByText("Save")).toBeTruthy());
    expect(screen.getByDisplayValue("Use Postgres")).toBeTruthy();
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("saveDecision", expect.anything()));
    expect(onSaved).toHaveBeenCalled();
  });

  it("shows error when extract fails", async () => {
    invoke.mockImplementation(async (name: string) => {
      if (name === "extractDecision") throw new Error("boom");
      return null;
    });
    render(<LogDecision text="x" />);
    fireEvent.click(screen.getByText("Log this decision"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("boom");
  });

  it("cancels without saving", async () => {
    invoke.mockResolvedValue({ title: "T" });
    render(<LogDecision text="x" />);
    fireEvent.click(screen.getByText("Log this decision"));
    await waitFor(() => expect(screen.getByText("Cancel")).toBeTruthy());
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Save")).toBeNull();
  });
});