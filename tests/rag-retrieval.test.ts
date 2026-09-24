import { describe, it, expect } from "vitest";
import { retrieveRelevantChunks, isRetrievalGrounded } from "@/lib/rag/retrieval";
import { DocumentChunk } from "@/lib/types";

describe("RAG Retrieval & Citation Grounding Engine", () => {
  const sampleChunks: DocumentChunk[] = [
    {
      id: "chk-1",
      documentId: "doc-1",
      page: 1,
      section: "SECTION 1. DEFINITIONS",
      clauseType: "other",
      text: "Definitions of capitalized words used throughout this services agreement.",
    },
    {
      id: "chk-2",
      documentId: "doc-1",
      page: 2,
      section: "SECTION 4. COMPENSATION",
      clauseType: "payments",
      text: "Client shall pay the Consultant a monthly consulting retainer of $10,000, payable on the first of each month.",
    },
    {
      id: "chk-3",
      documentId: "doc-1",
      page: 3,
      section: "SECTION 7. TERMINATION AND NOTICE",
      clauseType: "termination",
      text: "Either party may terminate this agreement at any time by providing thirty (30) days prior written notice.",
    },
    {
      id: "chk-4",
      documentId: "doc-1",
      page: 4,
      section: "SECTION 10. CONFIDENTIALITY",
      clauseType: "confidentiality",
      text: "Recipient shall hold all Proprietary Information in strict confidence and prevent unauthorized dissemination.",
    },
  ];

  it("retrieves the termination chunk for a termination query", () => {
    const results = retrieveRelevantChunks("What is the termination notice period?", sampleChunks, 2);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.id).toBe("chk-3");
    expect(results[0].chunk.section).toContain("TERMINATION");
    expect(results[0].chunk.page).toBe(3);
    expect(isRetrievalGrounded(results)).toBe(true);
  });

  it("retrieves the payment chunk for compensation inquiries", () => {
    const results = retrieveRelevantChunks("How much is the retainer fee and payment schedule?", sampleChunks, 2);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.id).toBe("chk-2");
    expect(results[0].chunk.section).toContain("COMPENSATION");
    expect(results[0].chunk.page).toBe(2);
  });

  it("correctly identifies ungrounded queries when terms are completely missing", () => {
    const results = retrieveRelevantChunks("What is the policy on flying commercial spacecraft to Mars?", sampleChunks, 2);
    const grounded = isRetrievalGrounded(results);
    expect(grounded).toBe(false);
  });
});
