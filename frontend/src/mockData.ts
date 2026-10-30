// Mock resolver responses used when the Forge bridge is unavailable (e.g. local dev/tests).
// Backend wires real resolvers later; see api-contract.md.

export interface Decision {
  id: string;
  title: string;
  summary: string;
  reasoning: string;
  alternativesRejected: string[];
  decidedBy: string;
  decidedAt: string;
  status: "active" | "superseded" | "revisited";
  tags: string[];
  sourceUrl: string;
  sourceType: string;
  supersededBy?: string;
  supersedes?: string;
}

export const MOCK_DECISIONS: Decision[] = [
  {
    id: "dec-001",
    title: "Use PostgreSQL for orders data",
    summary: "Orders and payments stored in PostgreSQL.",
    reasoning: "Strong consistency and mature tooling for transactional order data.",
    alternativesRejected: ["MongoDB", "DynamoDB"],
    decidedBy: "alice",
    decidedAt: "2025-09-01",
    status: "active",
    tags: ["database", "orders"],
    sourceUrl: "https://jira.example.com/browse/ORD-12",
    sourceType: "jira",
  },
  {
    id: "dec-002",
    title: "Redis caching for menu reads",
    summary: "Cache menu catalog in Redis with 5m TTL.",
    reasoning: "Reduces DB load on high-traffic menu endpoints.",
    alternativesRejected: ["in-memory", "memcached"],
    decidedBy: "bob",
    decidedAt: "2025-08-15",
    status: "active",
    tags: ["caching", "menu"],
    sourceUrl: "https://confluence.example.com/pages/123",
    sourceType: "confluence",
  },
  {
    id: "dec-003",
    title: "JWT auth via Auth0",
    summary: "Authentication handled by Auth0 with JWTs.",
    reasoning: "Offloads auth complexity and SSO support.",
    alternativesRejected: ["custom JWT", "Firebase Auth"],
    decidedBy: "carol",
    decidedAt: "2025-07-20",
    status: "superseded",
    tags: ["auth"],
    sourceUrl: "https://jira.example.com/browse/AUTH-3",
    sourceType: "jira",
  },
];

export function mockCheckConflict(decisionId: string): { conflicts: boolean; reason: string; decisionId?: string } {
  // Mock: flag conflict for the database decision only.
  if (decisionId === "dec-001") {
    return {
      conflicts: true,
      reason: "Switching to MongoDB contradicts the active decision to use PostgreSQL for orders.",
      decisionId,
    };
  }
  return { conflicts: false, reason: "", decisionId };
}
