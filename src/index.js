const r = require("./resolvers");

let handler;
try {
  const Resolver = require("@forge/resolver");
  const ResolverCtor = Resolver && (Resolver.default || Resolver);
  const resolver = new ResolverCtor();
  resolver.define("getText", r.getText);
  resolver.define("loadDemoData", r.loadDemoData);
  resolver.define("extractDecision", r.extractDecision);
  resolver.define("searchDecisions", r.searchDecisionsResolver);
  resolver.define("searchDecisionsResolver", r.searchDecisionsResolver);
  resolver.define("checkConflict", r.checkConflict);
  handler = resolver.getDefinitions();
} catch (e) {
  handler = r;
}

module.exports = { handler };
module.exports.handler = handler;