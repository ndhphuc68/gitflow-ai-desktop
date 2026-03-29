type MatchScore = {
  score: number;
  tieBreaker: number;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function scoreCommandMatch(
  queryRaw: string,
  title: string,
  subtitle?: string
): MatchScore | null {
  const query = normalize(queryRaw);
  if (!query) {
    return { score: 1, tieBreaker: 0 };
  }

  const haystacks = [title, subtitle ?? ""].map(normalize).filter(Boolean);
  let best: MatchScore | null = null;

  for (const haystack of haystacks) {
    const exact = haystack === query;
    if (exact) {
      const candidate = { score: 1000, tieBreaker: haystack.length };
      if (!best || candidate.score > best.score) best = candidate;
      continue;
    }

    const prefix = haystack.startsWith(query);
    if (prefix) {
      const candidate = { score: 700, tieBreaker: haystack.length };
      if (!best || candidate.score > best.score) best = candidate;
      continue;
    }

    const index = haystack.indexOf(query);
    if (index >= 0) {
      // Earlier match position is better.
      const candidate = { score: 400 - Math.min(index, 300), tieBreaker: haystack.length };
      if (!best || candidate.score > best.score) best = candidate;
    }
  }

  return best;
}

