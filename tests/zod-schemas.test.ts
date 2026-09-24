import { describe, it, expect } from "vitest";
import {
  FullDocumentAnalysisSchema,
  ClauseAnalysisSchema,
  QAAnswerSchema,
  AttentionLevelSchema,
} from "@/lib/types/schemas";

describe("Strict Zod Schema AI Output Validation Tests", () => {
  it("validates valid AttentionLevel values", () => {
    expect(AttentionLevelSchema.safeParse("INFORMATION").success).toBe(true);
    expect(AttentionLevelSchema.safeParse("IMPORTANT").success).toBe(true);
    expect(AttentionLevelSchema.safeParse("NEEDS_ATTENTION").success).toBe(true);
    // Invalid alarmist levels must fail
    expect(AttentionLevelSchema.safeParse("ILLEGAL").success).toBe(false);
    expect(AttentionLevelSchema.safeParse("DANGEROUS").success).toBe(false);
  });

  it("validates a complete ClauseAnalysis schema", () => {
    const clause = {
      id: "clause-1",
      title: "Notice of Termination",
      clauseType: "termination",
      explanation: "Requires 30 days written notice prior to termination.",
      appliesTo: "Both parties",
      obligations: ["Deliver formal written notice"],
      importantDates: ["30 days"],
      attentionLevel: "IMPORTANT",
      potentialQuestions: ["Does cure period apply?"],
      source: {
        page: 4,
        section: "Section 12.2",
      },
    };

    const result = ClauseAnalysisSchema.safeParse(clause);
    expect(result.success).toBe(true);
  });

  it("rejects malformed clauses missing required source reference", () => {
    const brokenClause = {
      title: "Notice of Termination",
      clauseType: "termination",
      explanation: "Some text",
      appliesTo: "Company",
      // missing source and attentionLevel
    };

    const result = ClauseAnalysisSchema.safeParse(brokenClause);
    expect(result.success).toBe(false);
  });

  it("validates QAAnswerSchema", () => {
    const qa = {
      answer: "The agreement duration is 2 years.",
      evidence: "This agreement shall remain in effect for two (2) years.",
      source: {
        page: 2,
        section: "Section 3. Term",
      },
      isSupportedByDocument: true,
    };

    const result = QAAnswerSchema.safeParse(qa);
    expect(result.success).toBe(true);
  });
});
