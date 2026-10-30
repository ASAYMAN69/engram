# Engram Rovo Agent — 10 Test Questions

Checked against seed data (10 decisions, dec-001..dec-010).

1. "Have we decided anything about caching?" → dec-001 (Redis session caching, active) + dec-004 (no PII in caches, active). Cite both IDs + source links.
2. "What database are we using?" → dec-002 (PostgreSQL primary, active). dec-009 (Forge KVS) only if storage asked.
3. "How do we authenticate users?" → dec-003 (JWT + refresh tokens, active).
4. "Can I cache user PII in the browser?" → dec-004 (no client-side PII caching, active) → answer: no, conflicts.
5. "Are we using GraphQL?" → dec-007 (superseded) + dec-008 (active, keep REST). Must mention superseded.
6. "What styling approach do we use?" → dec-005 (Tailwind, active).
7. "Why don't we use MongoDB?" → dec-002 (PostgreSQL chosen, MongoDB rejected).
8. "Where do we store decisions?" → dec-009 (Forge KVS, active).
9. "How does search work?" → dec-010 (tags + keyword scoring, no embeddings).
10. "Should I migrate the API to GraphQL?" → checkConflict → conflicts with dec-008; reason cited.

Edge: "Anything about Kubernetes?" → no recorded decision found.