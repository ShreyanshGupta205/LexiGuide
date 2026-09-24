import { DocumentChunk } from "@/lib/types";

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
  "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from",
  "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
  "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
  "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should",
  "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
  "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "with", "would", "you", "your", "yours", "yourself", "yourselves"
]);

export interface ScoredChunk {
  chunk: DocumentChunk;
  score: number;
  matchedTerms: string[];
}

/**
 * Tokenizes text into lowercase normalized keyword tokens, filtering stopwords
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Hybrid retrieval engine scoring chunks based on query relevance, section headers, and category
 */
export function retrieveRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  topK: number = 4
): ScoredChunk[] {
  if (!query || chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return chunks.slice(0, topK).map((c) => ({ chunk: c, score: 0.1, matchedTerms: [] }));
  }

  // Calculate inverse document frequency for query tokens across chunks
  const idf: Record<string, number> = {};
  for (const token of queryTokens) {
    let docsWithToken = 0;
    for (const chunk of chunks) {
      const combined = `${chunk.section} ${chunk.clauseType} ${chunk.text}`.toLowerCase();
      if (combined.includes(token)) {
        docsWithToken++;
      }
    }
    idf[token] = Math.log((chunks.length + 1) / (docsWithToken + 1)) + 1;
  }

  const scored: ScoredChunk[] = chunks.map((chunk) => {
    let score = 0;
    const matchedTerms: string[] = [];
    const textLower = chunk.text.toLowerCase();
    const sectionLower = chunk.section.toLowerCase();
    const clauseTypeLower = chunk.clauseType.toLowerCase();

    for (const token of queryTokens) {
      const tokenWeight = idf[token] || 1;
      let matchedInChunk = false;

      // Match in section header (high priority)
      if (sectionLower.includes(token)) {
        score += 3.5 * tokenWeight;
        matchedInChunk = true;
      }

      // Match in clause type
      if (clauseTypeLower.includes(token)) {
        score += 2.5 * tokenWeight;
        matchedInChunk = true;
      }

      // Match in chunk body text
      if (textLower.includes(token)) {
        // Count occurrences (sublinear scaling)
        const count = (textLower.match(new RegExp(`\\b${token}`, "g")) || []).length;
        score += (1 + Math.log(1 + count)) * tokenWeight;
        matchedInChunk = true;
      }

      if (matchedInChunk) {
        matchedTerms.push(token);
      }
    }

    // Normalized by text length to prevent bias towards giant chunks
    const lengthPenalty = Math.sqrt(chunk.text.length / 500);
    const finalScore = score / Math.max(1, lengthPenalty);

    return {
      chunk,
      score: finalScore,
      matchedTerms,
    };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

/**
 * Checks if the retrieved chunks meet the minimum relevance threshold
 */
export function isRetrievalGrounded(scoredChunks: ScoredChunk[]): boolean {
  if (scoredChunks.length === 0) return false;
  // If top score is above minimum confidence threshold and matched at least one key term
  return scoredChunks[0].score >= 1.2 && scoredChunks[0].matchedTerms.length > 0;
}
