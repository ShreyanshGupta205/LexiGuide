import { describe, it, expect } from "vitest";
import { LocalAIProvider } from "../lib/ai/local-provider";
import { LegalDocument } from "../lib/types";

describe("LexiGuide Advanced Intelligence: Symmetry & Negative Space", () => {
  const localAI = new LocalAIProvider();

  const mockOneSidedDoc: LegalDocument = {
    id: "doc-onesided-test",
    userId: "test-user",
    fileName: "contract_heavy_party_a.txt",
    fileSize: 2048,
    fileType: "txt",
    status: "analyzed",
    uploadDate: new Date().toISOString(),
    rawText: `
      EMPLOYMENT AND INVENTIONS AGREEMENT
      1. Immediate Termination: Company may terminate this Agreement immediately for cause without notice and without any cure period.
      2. Intellectual Property Assignment: Executive assigns all inventions, patents, ideas conceived during employment.
      3. Non-Compete: Executive shall not compete for 24 months following departure in any territory.
      4. Indemnification: Executive agrees to indemnify and hold harmless Company from any third party losses.
    `,
    sections: [
      { id: "s1", sectionNumber: "1", page: 1, title: "1. Immediate Termination", content: "Company may terminate this Agreement immediately for cause without notice and without any cure period." },
      { id: "s2", sectionNumber: "2", page: 1, title: "2. Intellectual Property Assignment", content: "Executive assigns all inventions, patents, ideas conceived during employment." },
      { id: "s3", sectionNumber: "3", page: 1, title: "3. Non-Compete", content: "Executive shall not compete for 24 months following departure in any territory." },
      { id: "s4", sectionNumber: "4", page: 1, title: "4. Indemnification", content: "Executive agrees to indemnify and hold harmless Company from any third party losses." },
    ],
    clauses: [
      {
        id: "c-nc",
        title: "Non-Compete Restriction",
        clauseType: "restrictions",
        explanation: "24-month non-compete restriction across all territories.",
        appliesTo: "Executive",
        obligations: ["Do not compete for 24 months"],
        importantDates: ["24 months post termination"],
        attentionLevel: "NEEDS_ATTENTION",
        potentialQuestions: ["What territory is covered?"],
        source: { page: 1, section: "3. Non-Compete" },
      },
      {
        id: "c-term",
        title: "Immediate Termination for Cause",
        clauseType: "termination",
        explanation: "Immediate termination without notice or cure period.",
        appliesTo: "Executive",
        obligations: [],
        importantDates: [],
        attentionLevel: "NEEDS_ATTENTION",
        potentialQuestions: ["Is there notice required?"],
        source: { page: 1, section: "1. Immediate Termination" },
      },
    ],
    summary: {
      documentType: "Employment Agreement",
      parties: ["Company Corp", "Executive"],
      effectiveDate: "2026-01-01",
      duration: "24 months",
      importantDates: [],
      majorObligations: ["Do not compete"],
      majorSections: ["Termination", "Non-Compete"],
    },
    findings: [],
    chunks: [],
  };

  it("calculates symmetry score and identifies power imbalances", async () => {
    const report = await localAI.generateAdvancedIntelligence(mockOneSidedDoc);

    expect(report).toBeDefined();
    expect(report.documentId).toBe("doc-onesided-test");
    expect(report.symmetry.overallScore).toBeLessThan(70);
    expect(report.symmetry.dimensions.length).toBe(4);

    // Verify dimensions
    const nonCompeteDim = report.symmetry.dimensions.find((d) =>
      d.name.includes("Non-Compete") || d.name.includes("Covenants")
    );
    expect(nonCompeteDim).toBeDefined();
    expect(nonCompeteDim?.status).toBe("unilateral");
  });

  it("detects missing standard protections in negative space", async () => {
    const report = await localAI.generateAdvancedIntelligence(mockOneSidedDoc);

    const missingIds = report.missingProtections.map((m) => m.id);
    expect(missingIds).toContain("miss-cure");
    expect(missingIds).toContain("miss-carveout");
    expect(missingIds).toContain("miss-cap");
    expect(missingIds).toContain("miss-mutual-indem");

    const cureGap = report.missingProtections.find((m) => m.id === "miss-cure");
    expect(cureGap?.riskSeverity).toBe("high");
    expect(cureGap?.sampleCounterLanguage).toBeTruthy();
    expect(cureGap?.sampleCounterLanguage).toContain("cure");
  });

  it("generates actionable counter-proposals with talking points for high-attention clauses", async () => {
    const report = await localAI.generateAdvancedIntelligence(mockOneSidedDoc);

    expect(report.counterProposals.length).toBeGreaterThan(0);
    const nonCompeteProposal = report.counterProposals.find((cp) =>
      cp.clauseTitle.toLowerCase().includes("non-compete")
    );

    expect(nonCompeteProposal).toBeDefined();
    expect(nonCompeteProposal?.suggestedWording).toContain("six (6) months");
    expect(nonCompeteProposal?.talkingPoints.length).toBeGreaterThan(0);
  });
});
