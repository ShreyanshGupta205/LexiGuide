import { DocumentSection } from "@/lib/types";

// Patterns for legal section headings
const SECTION_REGEX_PATTERNS = [
  // "Section 12.2 Termination Notice", "SECTION 4 - INDEMNITY"
  /^(?:SECTION|Section)\s+([0-9]+(?:\.[0-9]+)*)[:.\s\-—]+([^\n\r]+)/im,
  // "Article IV. Confidentiality", "ARTICLE 2: TERM"
  /^(?:ARTICLE|Article)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[:.\s\-—]+([^\n\r]+)/im,
  // "12.2 Termination", "1. DEFINITIONS"
  /^([0-9]+(?:\.[0-9]+)+)[:.\s\-—]+([A-Z][^\n\r]+)/m,
  // "1. Term and Termination"
  /^([0-9]+)\.\s+([A-Z][A-Za-z0-9\s,\-—&/()]{2,60})/m,
  // Major uppercase legal headers on their own line
  /^([A-Z\s]{4,40})$/m,
];

const LEGAL_CATEGORY_KEYWORDS: Record<string, string[]> = {
  termination: ["termination", "term", "cancellation", "severance", "expire", "expiration"],
  payments: ["payment", "compensation", "fee", "salary", "bonus", "equity", "remuneration", "invoice", "expenses"],
  obligations: ["duties", "responsibilities", "obligations", "covenants", "performance", "scope of work"],
  confidentiality: ["confidential", "non-disclosure", "proprietary", "secrecy", "trade secret"],
  intellectual_property: ["intellectual property", "inventions", "patents", "copyright", "assignment", "work made for hire"],
  liability: ["liability", "indemnification", "indemnity", "hold harmless", "limitation of liability", "damages"],
  renewal: ["renewal", "extension", "automatic renewal", "evergreen"],
  dispute_resolution: ["dispute", "arbitration", "mediation", "jurisdiction", "venue", "litigation"],
  governing_law: ["governing law", "choice of law", "applicable law", "jurisdiction"],
};

export function classifyClauseType(text: string, title?: string): string {
  const combined = `${title || ""} ${text}`.toLowerCase();

  for (const [category, keywords] of Object.entries(LEGAL_CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        return category;
      }
    }
  }

  return "other";
}

/**
 * Splits legal document text into structured sections with section numbers and titles
 */
export function detectDocumentSections(rawText: string, pageCount: number): DocumentSection[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split("\n");
  const sections: DocumentSection[] = [];
  
  let currentTitle = "Preamble & Recitals";
  let currentNumber = "Preamble";
  let currentLines: string[] = [];
  const charsPerPage = Math.max(500, Math.floor(rawText.length / pageCount));

  let runningCharCount = 0;
  let sectionIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    runningCharCount += lines[i].length + 1;
    const estimatedPage = Math.min(pageCount, Math.max(1, Math.ceil(runningCharCount / charsPerPage)));

    let matchedHeading = false;

    // Check line against legal section regexes
    for (const pattern of SECTION_REGEX_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // If we accumulated previous section lines, save that section
        if (currentLines.length > 0) {
          sections.push({
            id: `sec-${sectionIndex++}`,
            title: currentTitle,
            sectionNumber: currentNumber,
            page: Math.max(1, Math.min(pageCount, Math.ceil((runningCharCount - currentLines.join("\n").length) / charsPerPage))),
            content: currentLines.join("\n").trim(),
          });
          currentLines = [];
        }

        if (match[1] && match[2]) {
          currentNumber = `Section ${match[1].trim()}`;
          currentTitle = `Section ${match[1].trim()}: ${match[2].trim()}`;
        } else if (match[1]) {
          currentTitle = match[1].trim();
          currentNumber = `Sec ${sectionIndex + 1}`;
        } else {
          currentTitle = line;
          currentNumber = `Sec ${sectionIndex + 1}`;
        }

        matchedHeading = true;
        break;
      }
    }

    if (!matchedHeading) {
      currentLines.push(lines[i]);
    }
  }

  // Push the final section
  if (currentLines.length > 0) {
    sections.push({
      id: `sec-${sectionIndex}`,
      title: currentTitle,
      sectionNumber: currentNumber,
      page: Math.min(pageCount, Math.max(1, Math.ceil(runningCharCount / charsPerPage))),
      content: currentLines.join("\n").trim(),
    });
  }

  // If no sections were found (e.g. monolithic document), split by double line breaks
  if (sections.length <= 1 && rawText.length > 800) {
    const paragraphs = rawText.split(/\n\s*\n/);
    return paragraphs.map((para, idx) => ({
      id: `sec-${idx + 1}`,
      title: `Clause ${idx + 1}`,
      sectionNumber: `${idx + 1}`,
      page: Math.min(pageCount, Math.max(1, Math.ceil(((idx + 1) / paragraphs.length) * pageCount))),
      content: para.trim(),
    }));
  }

  return sections;
}
