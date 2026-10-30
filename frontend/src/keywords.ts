const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","is","are","was","were",
  "be","been","being","this","that","these","those","it","its","as","at","by","from","we",
  "i","you","he","she","they","them","our","your","their","will","would","should","could",
  "can","may","might","not","no","yes","do","does","did","have","has","had","use","using",
]);

export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (STOPWORDS.has(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}
