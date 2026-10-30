import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders relevant precedents panel", async () => {
    render(<App />);
    expect(screen.getByText("Relevant Precedents")).toBeTruthy();
    await waitFor(() => expect(screen.getAllByTestId("precedent-card").length).toBe(3));
  });
});
