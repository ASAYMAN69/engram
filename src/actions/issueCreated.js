export * from "../triggers/issueCreated.js";
import * as mod from "../triggers/issueCreated.js";
export default mod.default || mod.run;
export const run = mod.run;