import { describe, it, expect } from "vitest";
import { detectDocumentSections, classifyClauseType } from "@/lib/rag/section-detector";
import { chunkDocumentSections } from "@/lib/rag/chunker";
import { parseTxtBuffer } from "@/lib/parsers/txt-parser";

describe("Document Parser, Section Detection & Chunker Tests", () => {
  const sampleText = `SECTION 1. DEFINITIONS
In this Agreement, the following terms shall have the meanings set forth below.

SECTION 2. COMPENSATION AND PAYMENT
Company shall pay Executive a base salary of $150,000 per annum, payable in semi-monthly installments.

SECTION 3. TERMINATION NOTICE
Either party may terminate this Agreement without cause upon providing 30 days written notice to the other party.

SECTION 4. INTELLECTUAL PROPERTY
All inventions and software code created by Executive shall be assigned to Company.`;

  it("extracts text and estimates page count accurately", () => {
    const buffer = Buffer.from(sampleText, "utf-8");
    const result = parseTxtBuffer(buffer);
    expect(result.rawText).toContain("SECTION 1. DEFINITIONS");
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  it("detects structured sections from legal headings", () => {
    const sections = detectDocumentSections(sampleText, 2);
    expect(sections.length).toBeGreaterThanOrEqual(4);
    expect(sections[0].title.toUpperCase()).toContain("SECTION 1");
    expect(sections[1].title.toUpperCase()).toContain("SECTION 2");
    expect(sections[2].title.toUpperCase()).toContain("SECTION 3");
    expect(sections[3].title.toUpperCase()).toContain("SECTION 4");
  });

  it("accurately classifies legal clause types from headings and body text", () => {
    expect(classifyClauseType("30 days notice to terminate", "Termination")).toBe("termination");
    expect(classifyClauseType("base salary of $150,000", "Compensation")).toBe("payments");
    expect(classifyClauseType("all inventions assigned to company", "Intellectual Property")).toBe("intellectual_property");
    expect(classifyClauseType("governed by Delaware law", "Governing Law")).toBe("governing_law");
  });

  it("chunks sections while preserving section and page metadata", () => {
    const sections = detectDocumentSections(sampleText, 1);
    const chunks = chunkDocumentSections("test-doc-id", sections);

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.documentId).toBe("test-doc-id");
      expect(chunk.page).toBeGreaterThanOrEqual(1);
      expect(chunk.section).toBeDefined();
      expect(chunk.clauseType).toBeDefined();
      expect(chunk.text.length).toBeGreaterThan(0);
    });
  });
});
