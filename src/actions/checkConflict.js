import { checkConflict } from "../resolvers.js";
export const run = (req) => {
  const input = (req && req.payload) ? req.payload : (req || {});
  return checkConflict(input);
};