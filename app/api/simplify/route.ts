import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { getDocument } from "@/lib/store/document-store";
import { sanitizeUserInput } from "@/lib/security/sanitizer";
import { checkRateLimit, getRateLimitKey } from "@/lib/security/rate-limiter";
import { formatUntrustedDocumentContext, SYSTEM_SAFETY_PREAMBLE } from "@/lib/security/sanitizer";

/**
 * POST /api/simplify
 *
 * Simplifies a specific clause or section of a legal document into plain language.
 * Addresses the challenge use case: "Simplifying complex legal documents".
 *
 * Request body:
 *   - documentId: string — ID of the document to simplify
 *   - clauseTitle: string — Title of the specific clause/section to simplify
 *   - clauseText: string — The original legal text to simplify
 *
 * Returns:
 *   - simplifiedText: string — Plain-English explanation of the clause
 *   - readingLevel: string — Target reading level of the simplified output
 *   - keyPoints: string[] — Bullet-point list of the most important takeaways
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 20 simplification requests per IP per minute
    const rateLimitKey = getRateLimitKey(req);
    const { allowed } = checkRateLimit(rateLimitKey, 20, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before simplifying another clause." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = getCurrentSession(req);
    const body = await req.json();

    const { documentId, clauseTitle, clauseText } = body;

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json(
        { error: "A valid documentId is required." },
        { status: 400 }
      );
    }

    if (!clauseText || typeof clauseText !== "string" || clauseText.trim().length === 0) {
      return NextResponse.json(
        { error: "clauseText is required — provide the legal text to simplify." },
        { status: 400 }
      );
    }

    // Verify document ownership before processing
    const doc = await getDocument(documentId, session.userId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    // Sanitize inputs to prevent prompt injection
    const safeClauseTitle = sanitizeUserInput(clauseTitle || "Clause");
    const safeClauseText = sanitizeUserInput(clauseText.slice(0, 3000));

    // Attempt Gemini API simplification
    const apiKey = process.env.GEMINI_API_KEY;
    const providerType = process.env.AI_PROVIDER?.toLowerCase();

    if (apiKey && apiKey.length > 5 && providerType === "gemini") {
      const context = formatUntrustedDocumentContext(safeClauseText);
      const prompt = `${SYSTEM_SAFETY_PREAMBLE}

You are simplifying a legal clause into plain, accessible English for a non-lawyer.

Clause Title: "${safeClauseTitle}"

${context}

Your task:
1. Rewrite this clause in plain language that a high-school graduate can understand.
2. Extract 3-5 key takeaway bullet points.
3. Rate the simplified output reading level (e.g. "Grade 7", "Grade 9").

Return strict JSON:
{
  "simplifiedText": "Plain-English explanation of what this clause means in practice",
  "keyPoints": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "readingLevel": "Grade N"
}`;

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
            if (parsed.simplifiedText) {
              return NextResponse.json({
                success: true,
                documentId,
                clauseTitle: safeClauseTitle,
                simplifiedText: parsed.simplifiedText,
                keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
                readingLevel: parsed.readingLevel || "Grade 8",
                model: "gemini-flash-latest",
              });
            }
          }
        }
      } catch {
        // Fall through to local simplification
      }
    }

    // Local fallback: rule-based simplification
    const sentences = safeClauseText.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const simplified = sentences
      .slice(0, 3)
      .map((s) =>
        s
          .trim()
          .replace(/\bhereinafter\b/gi, "from now on called")
          .replace(/\bwhereas\b/gi, "given that")
          .replace(/\bnotwithstanding\b/gi, "despite")
          .replace(/\bpursuant to\b/gi, "according to")
          .replace(/\bshall\b/gi, "must")
          .replace(/\bthereunder\b/gi, "under this")
          .replace(/\bhereof\b/gi, "of this agreement")
          .replace(/\bthereof\b/gi, "of that")
          .replace(/\bindemnify\b/gi, "protect from loss")
          .replace(/\bforce majeure\b/gi, "unforeseeable circumstances outside anyone's control")
      )
      .join(". ");

    const keyPoints = [
      `This clause is part of the "${safeClauseTitle}" section`,
      `It sets out specific obligations or rights for the parties involved`,
      `Review with a legal professional if this clause is unclear or concerning`,
    ];

    return NextResponse.json({
      success: true,
      documentId,
      clauseTitle: safeClauseTitle,
      simplifiedText: simplified || "This clause establishes specific legal obligations. Please consult a legal professional for a full interpretation.",
      keyPoints,
      readingLevel: "Grade 8",
      model: "local-fallback",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to simplify the clause. Please try again." },
      { status: 500 }
    );
  }
}
