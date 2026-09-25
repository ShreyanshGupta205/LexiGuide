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

      // Use gemini-flash-latest with local fallback
      const models = ["gemini-flash-latest", "gemini-2.5-flash"];
      let rawJson = "";

      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (rawJson) break;
          }
        } catch {
          // try next model
        }
      }

      if (!rawJson) {
        throw new Error("Empty model response");
      }

      const parsed = JSON.parse(rawJson);
      const validated = FullDocumentAnalysisSchema.safeParse(parsed);

      if (validated.success) {
        return {
          summary: validated.data.summary,
          findings: validated.data.findings,
          clauses: validated.data.clauses,
        };
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
  ): Promise<{
    answer: string;
    evidence: string;
    source: { documentName: string; page: number; section: string; chunkId?: string };
    confidence: "high" | "moderate" | "unsupported";
  }> {
    try {
      const { retrieveRelevantChunks, isRetrievalGrounded } = await import("@/lib/rag/retrieval");
      const scoredChunks = retrieveRelevantChunks(question, chunks, 3);
      const isGrounded = isRetrievalGrounded(scoredChunks);

      if (!isGrounded || scoredChunks.length === 0) {
        return {
          answer: "I couldn't determine this from the provided document. The text does not contain explicit provisions or terms addressing this question.",
          evidence: "",
          source: {
            documentName,
            page: 1,
            section: "Document Search",
          },
          confidence: "unsupported",
        };
      }

      const best = scoredChunks[0].chunk;
      const prompt = `${SYSTEM_SAFETY_PREAMBLE}

You are an evidence-grounded legal analysis assistant. Answer the user question based strictly on the provided excerpt from "${documentName}".
Do not provide legal advice, speculate, or extrapolate beyond the explicit text.
If the excerpt does not address the question, return confidence "unsupported".

Excerpt (Section: "${best.section}", Page: ${best.page}):
"""
${best.text}
"""

User Question: ${question}

Return strict JSON:
{
  "answer": "Plain-language, factual answer explaining what the document states",
  "evidence": "Exact verbatim sentence or phrase from the excerpt supporting this answer"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (parsed.answer) {
            return {
              answer: parsed.answer,
              evidence: parsed.evidence || (best.text.length > 250 ? best.text.slice(0, 250) + "..." : best.text),
              source: {
                documentName,
                page: best.page,
                section: best.section,
                chunkId: best.id,
              },
              confidence: "high",
            };
          }
        }
      }
    } catch {
      // Safe fallback to deterministic local engine
    }

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
