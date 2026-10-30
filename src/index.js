// index.js: Forge resolver definitions for Engram.
import Resolver from "@forge/resolver";
import { loadDemoData } from "./storage/seed.js";
import { searchDecisions } from "./storage/index.js";

const resolver = new Resolver();

resolver.define("getText", (req) => {
  console.log(req);
  return "Hello Engram";
});

resolver.define("loadDemoData", async () => {
  return loadDemoData();
});

resolver.define("searchDecisionsResolver", async (req) => {
  const input = (req && req.payload) ? req.payload : (req || {});
  const { keywords = [], tags = [] } = input;
  return searchDecisions(keywords, tags);
});

export const handler = resolver.getDefinitions();