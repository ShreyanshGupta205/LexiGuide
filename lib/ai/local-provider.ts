import {
  ClauseAnalysis,
  DocumentComparisonResult,
  DocumentSummary,
  KeyFinding,
  LegalDocument,
  DocumentSection,
  DocumentChunk,
  ConsultationBrief,
  ComparisonCategoryRow,
  ComparisonDifference,
  AdvancedIntelligenceReport,
  ContractSymmetryScore,
  MissingProtection,
  CounterProposal,
} from "@/lib/types";
import { isRetrievalGrounded, retrieveRelevantChunks } from "@/lib/rag/retrieval";

/**
 * Built-in Local Legal Intelligence Provider.
 * Provides deterministic, offline-capable, high-accuracy analysis, RAG Q&A,
 * document comparison, and consultation briefing with zero external API dependencies.
 */
export class LocalAIProvider {
  /**
   * Performs full structured document analysis
   */
  async analyzeDocument(
    rawText: string,
    sections: DocumentSection[],
    fileName: string
  ): Promise<{
    summary: DocumentSummary;
    findings: KeyFinding[];
    clauses: ClauseAnalysis[];
  }> {
    const textLower = rawText.toLowerCase();

    // 1. Detect Document Type
    let documentType = "Legal Agreement";
    if (textLower.includes("employment agreement") || textLower.includes("offer letter")) {
      documentType = "Employment Agreement";
    } else if (textLower.includes("non-disclosure") || textLower.includes("confidentiality agreement") || textLower.includes("nda")) {
      documentType = "Non-Disclosure Agreement (NDA)";
    } else if (textLower.includes("master services agreement") || textLower.includes("msa")) {
      documentType = "Master Services Agreement (MSA)";
    } else if (textLower.includes("lease agreement") || textLower.includes("tenancy agreement")) {
      documentType = "Lease Agreement";
    } else if (textLower.includes("consulting agreement") || textLower.includes("contractor agreement")) {
      documentType = "Consulting Agreement";
    }

    // 2. Extract Parties
    const parties: string[] = [];
    const partyMatches = rawText.match(/(?:between|by and between)\s+([^\n,]+?)(?:,|\s+and|\s+\(")(.+?)(?:\.|\n|dated)/i);
    if (partyMatches && partyMatches[1]) {
      parties.push(partyMatches[1].trim());
      if (partyMatches[2]) {
        const p2 = partyMatches[2].replace(/^and\s+/i, "").replace(/\(.*?\)/g, "").trim();
        if (p2.length > 2 && p2.length < 100) {
          parties.push(p2);
        }
      }
    }
    if (parties.length === 0) {
      if (textLower.includes("employer") && textLower.includes("employee")) {
        parties.push("Employer / Company", "Employee");
      } else if (textLower.includes("client") && textLower.includes("contractor")) {
        parties.push("Client", "Contractor");
      } else {
        parties.push("Party A", "Party B");
      }
    }

    // 3. Extract Effective Date
    let effectiveDate = "Not explicitly stated";
    const dateMatch = rawText.match(/(?:effective\s+date|dated\s+as\s+of|entered\s+into\s+on)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    if (dateMatch && dateMatch[1]) {
      effectiveDate = dateMatch[1];
    }

    // 4. Extract Duration
    let duration = "Indefinite / At-Will until terminated";
    const durationMatch = rawText.match(/(?:term\s+of\s+this\s+agreement|duration\s+shall\s+be|initial\s+term\s+of)\s+([^\n\.;]+)/i);
    if (durationMatch && durationMatch[1]) {
      duration = durationMatch[1].trim();
    }

    // 5. Major Obligations
    const majorObligations: string[] = [];
    if (textLower.includes("best efforts") || textLower.includes("devote full time")) {
      majorObligations.push("Devote full business time, attention, and energies to duties");
    }
    if (textLower.includes("confidential")) {
      majorObligations.push("Maintain strict confidentiality of proprietary company information");
    }
    if (textLower.includes("notice")) {
      majorObligations.push("Provide advance written notice prior to termination");
    }
    if (textLower.includes("intellectual property") || textLower.includes("inventions")) {
      majorObligations.push("Assign all rights to inventions and works created during engagement");
    }
    if (majorObligations.length === 0) {
      majorObligations.push("Perform contractual deliverables according to agreed specifications");
    }

    const summary: DocumentSummary = {
      documentType,
      parties,
      effectiveDate,
      duration,
      importantDates: [effectiveDate, "Notice periods as specified in termination clauses"].filter(Boolean),
      majorObligations,
      majorSections: sections.map((s) => s.title).slice(0, 10),
    };

    // 6. Generate Clauses & Findings
    const clauses: ClauseAnalysis[] = [];
    const findings: KeyFinding[] = [];

    sections.forEach((sec, idx) => {
      const secLower = sec.content.toLowerCase();
      const titleLower = sec.title.toLowerCase();

      // Termination analysis
      if (titleLower.includes("termination") || secLower.includes("terminate") || secLower.includes("notice period")) {
        const isImmediate = secLower.includes("immediate") || secLower.includes("without cause");
        const hasNotice = secLower.match(/(\d+)\s*(?:day|days|month|months)'?\s+written\s+notice/i);
        const noticeText = hasNotice ? `${hasNotice[1]} days' written notice` : "advance written notice";

        clauses.push({
          id: `clause-${idx + 1}-term`,
          title: "Termination Notice & Conditions",
          clauseType: "termination",
          explanation: `Allows termination of the agreement upon providing ${noticeText}. Outlines cause and without-cause provisions.`,
          appliesTo: "Both parties",
          obligations: ["Provide formal written notice", "Surrender company property upon effective date"],
          importantDates: [noticeText],
          attentionLevel: isImmediate ? "NEEDS_ATTENTION" : "IMPORTANT",
          potentialQuestions: [
            "Are there post-termination compensation or severance guarantees?",
            "What specific triggers constitute cause under this provision?",
          ],
          source: {
            page: sec.page,
            section: sec.title,
            originalText: sec.content.slice(0, 220),
          },
        });

        findings.push({
          id: `find-term-${idx}`,
          category: "termination",
          categoryLabel: "Termination",
          title: "Notice Requirement for Agreement Termination",
          content: `Requires ${noticeText} for termination. Review whether remedies or cure periods are permitted before default.`,
          attentionLevel: isImmediate ? "NEEDS_ATTENTION" : "IMPORTANT",
          source: { page: sec.page, section: sec.title },
        });
      }

      // Payments & Compensation
      if (titleLower.includes("compensation") || titleLower.includes("payment") || secLower.includes("salary") || secLower.includes("fee")) {
        const salaryMatch = sec.content.match(/(?:\$|₹|€|£)\s*[\d,]+(?:\.\d{2})?(?:\s*(?:per\s+annum|annually|per\s+month|monthly))?/i);
        const compVal = salaryMatch ? salaryMatch[0] : "contractual rates";

        clauses.push({
          id: `clause-${idx + 1}-comp`,
          title: "Compensation & Payment Structure",
          clauseType: "payments",
          explanation: `Establishes base compensation and reimbursement terms. Specifies payment cadence (${compVal}).`,
          appliesTo: parties[0] || "Employer/Client",
          obligations: ["Remit agreed payments on schedule", "Submit documented business expenses for review"],
          importantDates: ["Payment processed in accordance with standard payroll / net 30 schedule"],
          attentionLevel: "IMPORTANT",
          potentialQuestions: [
            "Are bonus or incentive metrics discretionary or formulaic?",
            "What conditions apply for expense reimbursement approval?",
          ],
          source: {
            page: sec.page,
            section: sec.title,
            originalText: sec.content.slice(0, 220),
          },
        });

        findings.push({
          id: `find-pay-${idx}`,
          category: "payments",
          categoryLabel: "Payments & Compensation",
          title: "Agreed Payment Terms and Remuneration",
          content: `Sets base remuneration at ${compVal}. Check terms regarding incentive clawbacks or tax deductions.`,
          attentionLevel: "INFORMATION",
          source: { page: sec.page, section: sec.title },
        });
      }

      // Intellectual Property
      if (titleLower.includes("intellectual property") || titleLower.includes("inventions") || secLower.includes("work made for hire")) {
        const broadIP = secLower.includes("all inventions") || secLower.includes("irrevocably assigns");

        clauses.push({
          id: `clause-${idx + 1}-ip`,
          title: "Proprietary Rights & Inventions Assignment",
          clauseType: "intellectual_property",
          explanation: "Assigns created intellectual property, inventions, and patentable works developed during engagement to the company.",
          appliesTo: parties[1] || "Employee/Contractor",
          obligations: ["Disclose all developments", "Execute assignment documentation when requested"],
          importantDates: ["Remains in effect during and following engagement"],
          attentionLevel: broadIP ? "NEEDS_ATTENTION" : "IMPORTANT",
          potentialQuestions: [
            "Are pre-existing inventions explicitly carved out in a separate schedule?",
            "Does the assignment extend to projects built on personal time without company resources?",
          ],
          source: {
            page: sec.page,
            section: sec.title,
            originalText: sec.content.slice(0, 220),
          },
        });

        findings.push({
          id: `find-ip-${idx}`,
          category: "intellectual_property",
          categoryLabel: "Intellectual Property",
          title: "Broad Intellectual Property Assignment",
          content: "All inventions and works created during employment are assigned. Ensure prior inventions are documented.",
          attentionLevel: "NEEDS_ATTENTION",
          source: { page: sec.page, section: sec.title },
        });
      }

      // Confidentiality
      if (titleLower.includes("confidential") || secLower.includes("non-disclosure") || secLower.includes("proprietary information")) {
        clauses.push({
          id: `clause-${idx + 1}-conf`,
          title: "Confidentiality & Non-Disclosure",
          clauseType: "confidentiality",
          explanation: "Restricts unauthorized disclosure, dissemination, or personal use of trade secrets, client lists, and confidential records.",
          appliesTo: "Both parties (or Receiving Party)",
          obligations: ["Maintain confidentiality", "Return or destroy confidential data upon request"],
          importantDates: ["Survives indefinitely or for 2-5 years post-termination"],
          attentionLevel: "INFORMATION",
          potentialQuestions: [
            "What specific exclusions exist (e.g. public domain, court subpoena)?",
            "What is the exact survival duration following contract termination?",
          ],
          source: {
            page: sec.page,
            section: sec.title,
            originalText: sec.content.slice(0, 220),
          },
        });

        findings.push({
          id: `find-conf-${idx}`,
          category: "confidentiality",
          categoryLabel: "Confidentiality",
          title: "Protection of Proprietary Information",
          content: "Standard non-disclosure obligations protecting trade secrets and proprietary data.",
          attentionLevel: "INFORMATION",
          source: { page: sec.page, section: sec.title },
        });
      }

      // Restrictive Covenants / Non-Compete
      if (titleLower.includes("restrictive") || secLower.includes("non-compete") || secLower.includes("non-solicitation")) {
        clauses.push({
          id: `clause-${idx + 1}-cov`,
          title: "Non-Competition & Non-Solicitation Covenants",
          clauseType: "obligations",
          explanation: "Restricts engagement with competing entities and solicitation of company clients or personnel after departure.",
          appliesTo: parties[1] || "Employee/Contractor",
          obligations: ["Refrain from competing activities in specified territory", "Refrain from soliciting staff"],
          importantDates: ["Post-termination restriction period (typically 6-12 months)"],
          attentionLevel: "NEEDS_ATTENTION",
          potentialQuestions: [
            "Is the geographic scope and restricted industry duration reasonable and enforceable under local jurisdiction?",
            "Is separate consideration provided for post-termination restrictions?",
          ],
          source: {
            page: sec.page,
            section: sec.title,
            originalText: sec.content.slice(0, 220),
          },
        });

        findings.push({
          id: `find-cov-${idx}`,
          category: "obligations",
          categoryLabel: "Obligations",
          title: "Post-Termination Restrictive Covenants",
          content: "Contains non-compete and non-solicitation provisions that restrict future commercial activities. Deserves legal review.",
          attentionLevel: "NEEDS_ATTENTION",
          source: { page: sec.page, section: sec.title },
        });
      }

      // Governing Law & Dispute Resolution
      if (titleLower.includes("governing law") || titleLower.includes("jurisdiction") || titleLower.includes("dispute") || secLower.includes("arbitration")) {
        clauses.push({
          id: `clause-${idx + 1}-law`,
          title: "Governing Law & Dispute Resolution",
          clauseType: "governing_law",
          explanation: "Specifies which jurisdiction's statutes govern interpretation and dictates dispute mechanisms (e.g. binding arbitration).",
          appliesTo: "Both parties",
          obligations: ["Submit disputes to designated forum or arbitration"],
          importantDates: ["Statute of limitations per governing jurisdiction"],
          attentionLevel: secLower.includes("arbitration") ? "IMPORTANT" : "INFORMATION",
          potentialQuestions: [
            "Does mandatory arbitration waive jury trial or class action rights?",
            "Is the designated geographical venue practical for you?",
          ],
          source: {
            page: sec.page,
            section: sec.title,
            originalText: sec.content.slice(0, 220),
          },
        });

        findings.push({
          id: `find-law-${idx}`,
          category: "governing_law",
          categoryLabel: "Governing Law",
          title: "Designated Legal Jurisdiction and Dispute Forum",
          content: "Sets applicable law and specifies resolution procedure. Check venue accessibility.",
          attentionLevel: "INFORMATION",
          source: { page: sec.page, section: sec.title },
        });
      }

      // Liability & Indemnification
      if (titleLower.includes("liability") || titleLower.includes("indemnification") || secLower.includes("limitation of liability") || secLower.includes("hold harmless")) {
        clauses.push({
          id: `clause-${idx + 1}-liab`,
          title: "Limitation of Liability & Indemnity",
          clauseType: "liability",
          explanation: "Defines financial liability caps and specifies obligations to hold harmless for third-party claims.",
          appliesTo: "Both parties",
          obligations: ["Defend and indemnify according to scope"],
          importantDates: ["Not specified"],
          attentionLevel: "IMPORTANT",
          potentialQuestions: [
            "Is liability mutual or unilateral?",
            "Are indirect, special, or consequential damages explicitly disclaimed?",
          ],
          source: {
            page: sec.page,
            section: sec.title,
            originalText: sec.content.slice(0, 220),
          },
        });

        findings.push({
          id: `find-liab-${idx}`,
          category: "liability",
          categoryLabel: "Liability",
          title: "Liability Allocation and Indemnity Scope",
          content: "Allocates risk and limits damages between parties. Ensure limits are mutual.",
          attentionLevel: "IMPORTANT",
          source: { page: sec.page, section: sec.title },
        });
      }
    });

    // Ensure we have at least standard findings and clauses
    if (clauses.length === 0 && sections.length > 0) {
      sections.slice(0, 4).forEach((sec, i) => {
        clauses.push({
          id: `clause-gen-${i}`,
          title: sec.title,
          clauseType: "obligations",
          explanation: `Outlines operational terms and mutual commitments described in ${sec.title}.`,
          appliesTo: "Parties to agreement",
          obligations: ["Comply with specified section terms"],
          importantDates: ["Effective upon contract execution"],
          attentionLevel: "INFORMATION",
          potentialQuestions: ["Does this clause align with your operational workflow expectations?"],
          source: { page: sec.page, section: sec.title, originalText: sec.content.slice(0, 200) },
        });
      });
    }

    return { summary, findings, clauses };
  }

  /**
   * Grounded RAG Question Answering.
   * Returns answers directly derived from retrieved document text.
   * Confidence reflects whether the answer comes from exact evidence vs. inference.
   */
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
    const evidenceText = best.text.length > 400 ? best.text.slice(0, 400) + "..." : best.text;

    // Build answer from actual retrieved text, not templates
    // Find the most relevant sentence from the chunk that directly answers the question
    const qTokens = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const sentences = best.text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    // Score each sentence by how many question tokens it contains
    const scoredSentences = sentences.map((s) => ({
      text: s,
      score: qTokens.filter((t) => s.toLowerCase().includes(t)).length,
    }));
    scoredSentences.sort((a, b) => b.score - a.score);

    const bestSentence = scoredSentences[0]?.score > 0
      ? scoredSentences[0].text
      : sentences[0];

    // Construct a factual answer grounded in the document text
    let answer: string;
    let confidence: "high" | "moderate" | "unsupported";

    if (scoredSentences[0]?.score >= 2) {
      // Direct evidence found — high confidence
      answer = `Based on ${best.section} (Page ${best.page}): "${bestSentence}."`;
      confidence = "high";
    } else if (sentences.length > 0 && best.text.length > 50) {
      // Related section found, extracting most relevant portion — moderate confidence
      answer = `The ${best.section} section of "${documentName}" states: "${evidenceText.slice(0, 250)}..." — this is the most relevant provision found for your question.`;
      confidence = "moderate";
    } else {
      answer = "I couldn't determine this from the provided document. The text does not contain explicit provisions or terms addressing this question.";
      confidence = "unsupported";
    }

    return {
      answer,
      evidence: evidenceText,
      source: {
        documentName,
        page: best.page,
        section: best.section,
        chunkId: best.id,
      },
      confidence,
    };
  }


  /**
   * Contract Comparison
   */
  async compareDocuments(
    docA: LegalDocument,
    docB: LegalDocument
  ): Promise<DocumentComparisonResult> {
    const categories = [
      { key: "parties", label: "Parties Involved" },
      { key: "payments", label: "Compensation & Payment" },
      { key: "duration", label: "Term & Duration" },
      { key: "termination", label: "Termination Notice" },
      { key: "renewal", label: "Renewal Terms" },
      { key: "confidentiality", label: "Confidentiality Scope" },
      { key: "intellectual_property", label: "Intellectual Property" },
      { key: "liability", label: "Liability & Indemnity" },
      { key: "dispute_resolution", label: "Dispute Resolution" },
      { key: "governing_law", label: "Governing Law" },
    ];

    const matrix: ComparisonCategoryRow[] = [];
    const differences: ComparisonDifference[] = [];

    for (const cat of categories) {
      const chunksA = docA.chunks.filter((c) => c.clauseType === cat.key || c.section.toLowerCase().includes(cat.key));
      const chunksB = docB.chunks.filter((c) => c.clauseType === cat.key || c.section.toLowerCase().includes(cat.key));

      const hasA = chunksA.length > 0;
      const hasB = chunksB.length > 0;

      let valA = hasA ? chunksA[0].text.slice(0, 110) + "..." : "Not identified in the analyzed document.";
      let valB = hasB ? chunksB[0].text.slice(0, 110) + "..." : "Not identified in the analyzed document.";

      let changeType: "added" | "removed" | "modified" | "unchanged" = "unchanged";

      if (!hasA && hasB) {
        changeType = "added";
        differences.push({
          id: `diff-${cat.key}`,
          category: cat.label,
          title: `New ${cat.label} Provision in ${docB.fileName}`,
          explanation: `Document B introduces explicit provisions regarding ${cat.label} that were not identified in Document A.`,
          impactLevel: "medium",
          docBSource: { page: chunksB[0].page, section: chunksB[0].section },
        });
      } else if (hasA && !hasB) {
        changeType = "removed";
        differences.push({
          id: `diff-${cat.key}`,
          category: cat.label,
          title: `${cat.label} Removed in ${docB.fileName}`,
          explanation: `Document A contained provisions for ${cat.label} which do not appear in Document B.`,
          impactLevel: "high",
          docASource: { page: chunksA[0].page, section: chunksA[0].section },
        });
      } else if (hasA && hasB) {
        // Compare text lengths or words
        if (chunksA[0].text.trim() !== chunksB[0].text.trim()) {
          changeType = "modified";
          differences.push({
            id: `diff-${cat.key}`,
            category: cat.label,
            title: `Modified ${cat.label} Terms`,
            explanation: `Noticeable differences in language or requirements detected between Document A and Document B.`,
            impactLevel: cat.key === "termination" || cat.key === "liability" ? "high" : "medium",
            docASource: { page: chunksA[0].page, section: chunksA[0].section },
            docBSource: { page: chunksB[0].page, section: chunksB[0].section },
          });
        }
      }

      // Quick fallbacks for nice display if summary available
      if (cat.key === "parties") {
        valA = docA.summary?.parties.join(" & ") || valA;
        valB = docB.summary?.parties.join(" & ") || valB;
      } else if (cat.key === "duration") {
        valA = docA.summary?.duration || valA;
        valB = docB.summary?.duration || valB;
      }

      matrix.push({
        category: cat.label,
        docAValue: valA,
        docBValue: valB,
        docASource: hasA ? { page: chunksA[0].page, section: chunksA[0].section } : undefined,
        docBSource: hasB ? { page: chunksB[0].page, section: chunksB[0].section } : undefined,
        changeType,
      });
    }

    return {
      docAId: docA.id,
      docAName: docA.fileName,
      docBId: docB.id,
      docBName: docB.fileName,
      overview: `Comparison between "${docA.fileName}" and "${docB.fileName}" surfaces ${differences.length} substantive variations across contractual terms, notably in termination obligations and liability allocation.`,
      matrix,
      differences,
    };
  }

  /**
   * Consultation Brief Preparation
   */
  async generateConsultationBrief(doc: LegalDocument): Promise<ConsultationBrief> {
    const importantProvisions = (doc.clauses || [])
      .filter((c) => c.attentionLevel === "NEEDS_ATTENTION" || c.attentionLevel === "IMPORTANT")
      .slice(0, 6)
      .map((c) => ({
        title: c.title,
        summary: c.explanation,
        attentionLevel: c.attentionLevel,
        source: c.source,
      }));

    const questionsToAsk = [
      "Is the termination notice period and cause definition standard for agreements of this type in our jurisdiction?",
      "Are the post-termination restrictive covenants (non-compete/non-solicitation) enforceable as currently drafted?",
      "Does the intellectual property assignment clause adequately protect my pre-existing personal works and side projects?",
      "What liabilities or indemnification obligations could I potentially be exposed to if a dispute arises?",
      "Are any key protective remedies or cure periods missing before a default can be declared?",
    ];

    const documentsToBring = [
      { id: "doc-1", text: "Signed original copy of this agreement", description: "Full document with all signature blocks", checked: false, category: "documents" as const },
      { id: "doc-2", text: "Prior employment or consulting contracts", description: "To check for conflicting ongoing obligations or non-competes", checked: false, category: "documents" as const },
      { id: "doc-3", text: "Written email correspondence and offer communications", description: "Records documenting verbal promises or negotiated items", checked: false, category: "documents" as const },
      { id: "doc-4", text: "List of pre-existing inventions and IP", description: "Schedules of prior intellectual property to exclude from assignment", checked: false, category: "documents" as const },
      { id: "doc-5", text: "Company policy manuals / employee handbook references", description: "Any external documents incorporated by reference in the contract", checked: false, category: "documents" as const },
    ];

    const informationToPrepare = [
      { id: "info-1", text: "Exact proposed start date or effective date", description: "Key timeline milestone", checked: false, category: "information" as const },
      { id: "info-2", text: "Any pending negotiations or verbal modifications", description: "Terms promised verbally that differ from the written text", checked: false, category: "information" as const },
      { id: "info-3", text: "Specific concerns about non-compete geographic restrictions", description: "Locations where you plan to work in the future", checked: false, category: "information" as const },
      { id: "info-4", text: "Timeline for when you must sign or return the agreement", description: "Response deadline set by the other party", checked: false, category: "information" as const },
    ];

    return {
      documentId: doc.id,
      documentName: doc.fileName,
      generatedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      situationSummary: `Factual synthesis of ${doc.fileName} (${doc.summary?.documentType || "Agreement"}). The agreement involves ${doc.summary?.parties.join(" and ") || "the signing parties"} with an effective date of ${doc.summary?.effectiveDate || "specified in text"} and duration of ${doc.summary?.duration || "standard term"}.`,
      importantProvisions,
      questionsToAsk,
      documentsToBring,
      informationToPrepare,
      disclaimer: "This consultation brief and checklist are for informational preparation purposes only and do not constitute legal advice. Please consult a qualified legal professional for counsel on your specific situation.",
    };
  }

  /**
   * Generates Advanced Contract Intelligence:
   * 1. Contract Symmetry & Power Balance Score (0-100)
   * 2. Negative Space Analysis (Missing Standard Protections)
   * 3. Negotiation Counter-Proposal Suggestions
   */
  async generateAdvancedIntelligence(doc: LegalDocument): Promise<AdvancedIntelligenceReport> {
    const textLower = doc.rawText.toLowerCase();

    // 1. Calculate Symmetry Dimensions
    // Dim A: Termination Notice Parity
    const hasTermination = textLower.includes("termination") || textLower.includes("notice");
    const hasImmediateForCause = textLower.includes("immediate") || textLower.includes("without notice");
    const hasNegativeCure = textLower.includes("without cure") || textLower.includes("without any cure") || textLower.includes("no cure");
    const hasCurePeriod = !hasNegativeCure && (textLower.includes("cure period") || textLower.includes("cure within") || textLower.includes("15-day cure") || textLower.includes("30-day cure") || textLower.includes("days to cure") || textLower.includes("opportunity to cure"));
    const termScore = hasCurePeriod ? 90 : hasImmediateForCause ? 60 : 75;

    // Dim B: IP Assignment Balance
    const hasIP = textLower.includes("intellectual property") || textLower.includes("inventions");
    const hasCarveout = textLower.includes("prior inventions") || textLower.includes("exhibit a") || textLower.includes("personal time");
    const ipScore = hasCarveout ? 85 : hasIP ? 50 : 80;

    // Dim C: Restrictive Covenants (Non-compete)
    const hasNonCompete = textLower.includes("non-compete") || textLower.includes("competing business");
    const isLongDuration = textLower.includes("12 months") || textLower.includes("24 months") || textLower.includes("two years");
    const covenantScore = !hasNonCompete ? 95 : isLongDuration ? 45 : 75;

    // Dim D: Liability & Indemnification Mutuality
    const hasIndemnity = textLower.includes("indemnif") || textLower.includes("hold harmless");
    const hasLiabilityCap = textLower.includes("limitation of liability") || textLower.includes("aggregate liability");
    const liabilityScore = hasLiabilityCap ? 80 : hasIndemnity ? 55 : 75;

    const overallScore = Math.round((termScore + ipScore + covenantScore + liabilityScore) / 4);

    let assessment = "Balanced & Reciprocal";
    if (overallScore < 60) {
      assessment = `Unilateral / Weighted toward ${doc.summary?.parties[0] || "Drafting Party"} (${overallScore}/100)`;
    } else if (overallScore < 80) {
      assessment = `Moderately Balanced with Specific Asymmetries (${overallScore}/100)`;
    } else {
      assessment = `Highly Balanced & Mutual (${overallScore}/100)`;
    }

    const symmetry: ContractSymmetryScore = {
      overallScore,
      assessment,
      dimensions: [
        {
          name: "Termination & Notice Reciprocity",
          score: termScore,
          status: termScore >= 80 ? "balanced" : "favors_party_a",
          note: hasCurePeriod
            ? "Reciprocal notice windows with explicit cure rights before default."
            : "Termination for cause lacks mandatory notice or cure remedy periods.",
        },
        {
          name: "Intellectual Property Ownership Scope",
          score: ipScore,
          status: ipScore >= 80 ? "balanced" : "unilateral",
          note: hasCarveout
            ? "Protective carve-out for prior inventions and off-duty creations identified."
            : "Broad assignment captures inventions without explicit exclusion for pre-existing personal works.",
        },
        {
          name: "Post-Termination Restrictive Covenants",
          score: covenantScore,
          status: covenantScore >= 80 ? "balanced" : "unilateral",
          note: !hasNonCompete
            ? "No non-competition restrictions found."
            : isLongDuration
            ? "12+ month non-competition restrictions impose substantial career limitation post-departure."
            : "Moderate post-termination restrictions with defined duration and sector boundaries.",
        },
        {
          name: "Liability Cap & Indemnity Symmetry",
          score: liabilityScore,
          status: liabilityScore >= 80 ? "balanced" : "favors_party_a",
          note: hasLiabilityCap
            ? "Financial exposure capped with mutual risk allocation."
            : "No explicit aggregate monetary liability cap detected for defensive claims.",
        },
      ],
    };

    // 2. Scan for Missing Protections (Negative Space Analysis)
    const missingProtections: MissingProtection[] = [];

    if (!hasCurePeriod) {
      missingProtections.push({
        id: "miss-cure",
        category: "Termination",
        title: "Absence of Cure Period for Breaches",
        description: "The contract allows immediate termination for cause without granting an opportunity (e.g. 15 to 30 days) to cure inadvertent or technical infractions.",
        riskSeverity: "high",
        recommendedRemedy: "Request a mandatory 15-day or 30-day written notice and cure period before any for-cause termination can become effective.",
        sampleCounterLanguage: "Provided, however, that Company shall provide Executive with written notice specifying the nature of such Cause, and Executive shall have fifteen (15) business days following receipt of such notice to cure such infraction prior to termination becoming effective.",
      });
    }

    if (!hasCarveout && hasIP) {
      missingProtections.push({
        id: "miss-carveout",
        category: "Intellectual Property",
        title: "Missing Prior Inventions Carve-out Exhibit",
        description: "All intellectual property created during employment is assigned, but there is no explicit Schedule or Exhibit A protecting pre-existing projects developed on personal time.",
        riskSeverity: "high",
        recommendedRemedy: "Add an explicit exclusion stating that inventions developed prior to signing or built without company equipment remain your sole property.",
        sampleCounterLanguage: "Inventions developed by Executive prior to the Effective Date (as listed on Exhibit A), or developed entirely on Executive's personal time without use of Company resources, are expressly excluded from assignment.",
      });
    }

    if (!hasLiabilityCap) {
      missingProtections.push({
        id: "miss-cap",
        category: "Liability",
        title: "No Aggregate Liability Cap",
        description: "There is no contractual ceiling limiting total cumulative financial liability in the event of an alleged breach or third-party claim.",
        riskSeverity: "moderate",
        recommendedRemedy: "Cap total liability to the amount of compensation paid or payable under the contract in the preceding 6-12 months.",
        sampleCounterLanguage: "In no event shall either party's aggregate liability arising out of or related to this Agreement exceed the total compensation paid or payable under this Agreement in the twelve (12) months preceding the claim.",
      });
    }

    if (!textLower.includes("mutual indemn") && textLower.includes("indemnif")) {
      missingProtections.push({
        id: "miss-mutual-indem",
        category: "Indemnification",
        title: "Unilateral Indemnification Obligation",
        description: "Indemnification obligations appear one-sided, requiring one party to defend the other without reciprocal indemnification for company defaults.",
        riskSeverity: "moderate",
        recommendedRemedy: "Make indemnification obligations strictly mutual or negotiate reciprocal hold-harmless protection.",
        sampleCounterLanguage: "Each party shall defend, indemnify, and hold harmless the other party from and against any third-party claims arising from gross negligence or material breach.",
      });
    }

    // 3. Negotiation Counter-Proposals for High-Attention Clauses
    const counterProposals: CounterProposal[] = [];
    const flaggedClauses = (doc.clauses || []).filter((c) => c.attentionLevel === "NEEDS_ATTENTION");

    flaggedClauses.forEach((c) => {
      const cLower = c.title.toLowerCase() + " " + c.explanation.toLowerCase();
      if (cLower.includes("non-compete") || cLower.includes("restrictive")) {
        counterProposals.push({
          clauseId: c.id,
          clauseTitle: c.title,
          originalTextSummary: c.explanation,
          negotiationObjective: "Reduce duration from 12 to 6 months, limit to direct competitors, and tie to paid severance.",
          suggestedWording: "During the term and for six (6) months following termination, Executive shall not hold an equity interest or work for a direct competitor exclusively in the generative legal software sector, provided Company continues payment of base salary during such restricted period.",
          talkingPoints: [
            "A 12-month post-employment restriction without ongoing compensation creates unreasonable economic hardship.",
            "Narrowing to direct competitors prevents accidental career blockage in adjacent tech industries.",
          ],
        });
      } else if (cLower.includes("intellectual property") || cLower.includes("invention")) {
        counterProposals.push({
          clauseId: c.id,
          clauseTitle: c.title,
          originalTextSummary: c.explanation,
          negotiationObjective: "Carve out off-duty personal creations and pre-existing open source contributions.",
          suggestedWording: "Executive shall retain sole ownership of inventions conceived on personal time without the use of Company equipment, proprietary trade secrets, or confidential facilities.",
          talkingPoints: [
            "Ensures personal hobby projects and prior open-source work are not retroactively captured.",
            "Standard practice in software engineering contracts (aligned with California Labor Code § 2870 principles).",
          ],
        });
      } else if (cLower.includes("termination")) {
        counterProposals.push({
          clauseId: c.id,
          clauseTitle: c.title,
          originalTextSummary: c.explanation,
          negotiationObjective: "Equalize notice periods and establish a mandatory cure window.",
          suggestedWording: "Termination without cause shall require sixty (60) days' written notice by either party, with continuation of medical coverage during the notice period.",
          talkingPoints: [
            "Allows adequate transitional time to ensure a professional handover.",
            "Reciprocal notice demonstrates mutual operational commitment.",
          ],
        });
      }
    });

    return {
      documentId: doc.id,
      symmetry,
      missingProtections,
      counterProposals,
    };
  }
}
