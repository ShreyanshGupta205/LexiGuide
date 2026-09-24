import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { getDocument } from "@/lib/store/document-store";
import { sanitizeUserInput } from "@/lib/security/sanitizer";
import { getAIProvider } from "@/lib/ai/provider";

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    const body = await req.json();

    const { documentId, question } = body;

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json(
        { error: "A valid documentId is required." },
        { status: 400 }
      );
    }

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "A question must be provided." },
        { status: 400 }
      );
    }

    const doc = await getDocument(documentId, session.userId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    // Sanitize user question to strip prompt injection attempts
    const sanitizedQuestion = sanitizeUserInput(question);

    const aiProvider = getAIProvider();
    const result = await aiProvider.answerQuestion(
      sanitizedQuestion,
      doc.chunks || [],
      doc.fileName
    );

    return NextResponse.json({
      success: true,
      interaction: {
        id: `qa-${Date.now()}`,
        documentId: doc.id,
        question: sanitizedQuestion,
        answer: result.answer,
        evidence: result.evidence,
        source: result.source,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while answering your question. Please try again." },
      { status: 500 }
    );
  }
}
