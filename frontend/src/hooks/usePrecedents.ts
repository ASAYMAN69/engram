import { useEffect, useState } from "react";
import { readIssueContext, searchDecisions, checkConflict } from "../api";
import { extractKeywords } from "../keywords";
import type { Decision } from "../mockData";

export interface Match {
  decision: Decision;
  proposed?: string;
  conflict?: { conflicts: boolean; reason: string; decisionId?: string };
}

export function usePrecedents() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { summary, description } = await readIssueContext();
      const keywords = extractKeywords(`${summary} ${description}`);
      const proposed = `${summary} ${description}`;
      const decisions = await searchDecisions(keywords, []);
      const top = decisions.slice(0, 3);
      const withConflicts = await Promise.all(
        top.map(async (d) => ({
          decision: d,
          proposed,
          conflict: await checkConflict(proposed, d.id),
        }))
      );
      if (cancelled) return;
      setMatches(withConflicts);
      setEmpty(withConflicts.length === 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, matches, empty };
}
