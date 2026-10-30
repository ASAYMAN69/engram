// Shared types for Engram
export type DecisionStatus = "active" | "superseded" | "revisited";

export interface Decision {
  id: string;
  title: string;
  summary: string;
  reasoning: string;
  alternativesRejected: string[];
  decidedBy: string;
  decidedAt: string;
  status: DecisionStatus;
  tags: string[];
  sourceUrl: string;
  sourceType: string;
}

export interface SearchQuery {
  keywords: string[];
  tags: string[];
}
