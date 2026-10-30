import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders hello engram", () => {
    render(<App />);
    expect(screen.getByText("Hello Engram")).toBeTruthy();
  });
});
