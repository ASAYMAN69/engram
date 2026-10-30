import { extractDecision } from "../resolvers.js";
export const run = (req) => {
  const input = (req && req.payload) ? req.payload : (req || {});
  return extractDecision(input);
};