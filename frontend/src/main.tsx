import React from "react";
import { createRoot } from "react-dom/client";
import { view } from "@forge/bridge";
import App from "./App";
import "./index.css";

async function bootstrap() {
  try {
    await view.theme.enable();
  } catch (e) {
    // not in Forge runtime (tests/dev) -> ignore
  }
  const root = document.getElementById("root");
  if (root) createRoot(root).render(<App />);
}

bootstrap();