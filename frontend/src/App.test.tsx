import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@forge/bridge", () => ({ invoke, view: { getContext: vi.fn().mockResolvedValue({}) } }));

describe("App", () => {
  it("renders relevant precedents panel", async () => {
    render(<App />);
    expect(screen.getByText("Relevant Precedents")).toBeTruthy();
    await waitFor(() => expect(screen.getAllByTestId("precedent-card").length).toBe(3));
  });
});
