import { LocalAIProvider } from "./local-provider";
import {
  ClauseAnalysis,
  DocumentComparisonResult,
  DocumentSummary,
  KeyFinding,
  LegalDocument,
  DocumentSection,
  DocumentChunk,
  ConsultationBrief,
} from "@/lib/types";
import { formatUntrustedDocumentContext, SYSTEM_SAFETY_PREAMBLE } from "@/lib/security/sanitizer";
import { FullDocumentAnalysisSchema, QAAnswerSchema } from "@/lib/types/schemas";

export interface IAIProvider {
  analyzeDocument(
    rawText: string,
    sections: DocumentSection[],
    fileName: string
  ): Promise<{
    summary: DocumentSummary;
    findings: KeyFinding[];
    clauses: ClauseAnalysis[];
  }>;

  answerQuestion(
    question: string,
    chunks: DocumentChunk[],
    documentName: string
  ): Promise<{
    answer: string;
    evidence: string;
    source: { documentName: string; page: number; section: string; chunkId?: string };
    confidence: "high" | "moderate" | "unsupported";
  }>;

  compareDocuments(
    docA: LegalDocument,
    docB: LegalDocument
  ): Promise<DocumentComparisonResult>;

  generateConsultationBrief(doc: LegalDocument): Promise<ConsultationBrief>;
}

/**
 * Gemini AI Provider with Zod validation and safe local fallback
 */
export class GeminiAIProvider implements IAIProvider {
  private apiKey: string;
  private localFallback: LocalAIProvider;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.localFallback = new LocalAIProvider();
  }

  async analyzeDocument(
    rawText: string,
    sections: DocumentSection[],
    fileName: string
  ): Promise<{
    summary: DocumentSummary;
    findings: KeyFinding[];
    clauses: ClauseAnalysis[];
  }> {
    try {
      const sanitizedContext = formatUntrustedDocumentContext(rawText.slice(0, 15000));
      const prompt = `${SYSTEM_SAFETY_PREAMBLE}

Analyze this legal document. Extract the summary, key findings, and clause breakdown.
Return strict JSON matching this structure:
{
  "summary": {
    "documentType": string,
    "parties": string[],
    "effectiveDate": string,
    "duration": string,
    "importantDates": string[],
    "majorObligations": string[],
    "majorSections": string[]
  },
  "findings": [
    {
      "category": "obligations" | "payments" | "termination" | "confidentiality" | "intellectual_property" | "liability" | "renewal" | "dispute_resolution" | "governing_law" | "other",
      "categoryLabel": string,
      "title": string,
      "content": string,
      "attentionLevel": "INFORMATION" | "IMPORTANT" | "NEEDS_ATTENTION",
      "source": { "page": number, "section": string }
    }
  ],
  "clauses": [
    {
      "title": string,
      "clauseType": string,
      "explanation": string,
      "appliesTo": string,
      "obligations": string[],
      "importantDates": string[],
      "attentionLevel": "INFORMATION" | "IMPORTANT" | "NEEDS_ATTENTION",
      "potentialQuestions": string[],
      "source": { "page": number, "section": string, "originalText": string }
    }
  ]
}

Document:
${sanitizedContext}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.statusText}`);
      }

      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error("Empty model response");
      }

      const parsed = JSON.parse(rawJson);
      const validated = FullDocumentAnalysisSchema.safeParse(parsed);

      if (validated.success) {
        return validated.data as any;
      }
    } catch {
      // Safe fallback to local engine
    }

    return this.localFallback.analyzeDocument(rawText, sections, fileName);
  }

  async answerQuestion(
    question: string,
    chunks: DocumentChunk[],
    documentName: string
  ) {
    return this.localFallback.answerQuestion(question, chunks, documentName);
  }

  async compareDocuments(docA: LegalDocument, docB: LegalDocument) {
    return this.localFallback.compareDocuments(docA, docB);
  }

  async generateConsultationBrief(doc: LegalDocument) {
    return this.localFallback.generateConsultationBrief(doc);
  }
}

/**
 * Returns active AI Provider based on environment configuration
 */
export function getAIProvider(): IAIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const providerType = process.env.AI_PROVIDER?.toLowerCase();

  if (apiKey && apiKey.length > 5 && providerType === "gemini") {
    return new GeminiAIProvider(apiKey);
  }

  return new LocalAIProvider();
}
