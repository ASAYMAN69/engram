// index.js: Forge resolver definitions for Engram.
import Resolver from "@forge/resolver";
import { loadDemoData } from "./storage/seed.js";
import { searchDecisions } from "./storage/index.js";
import { extractDecision, searchDecisionsResolver, checkConflict } from "./resolvers.js";

const resolver = new Resolver();

resolver.define("getText", (req) => {
  return "Hello Engram";
});

resolver.define("loadDemoData", async () => {
  return loadDemoData();
});

resolver.define("searchDecisionsResolver", async (req) => {
  const input = (req && req.payload) ? req.payload : (req || {});
  return searchDecisionsResolver(input);
});

resolver.define("extractDecision", async (req) => {
  const input = (req && req.payload) ? req.payload : (req || {});
  return extractDecision(input);
});

resolver.define("checkConflict", async (req) => {
  const input = (req && req.payload) ? req.payload : (req || {});
  return checkConflict(input);
});

export const handler = resolver.getDefinitions();
