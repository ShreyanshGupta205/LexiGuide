import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { getDocument } from "@/lib/store/document-store";
import { LocalAIProvider } from "@/lib/ai/local-provider";
import { checkRateLimit, getRateLimitKey } from "@/lib/security/rate-limiter";

const localAI = new LocalAIProvider();

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 10 advanced analysis requests per IP per minute
    const rateLimitKey = getRateLimitKey(req);
    const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before generating another analysis." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = getCurrentSession(req);
    const body = await req.json();

    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "A documentId must be provided." },
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

    const report = await localAI.generateAdvancedIntelligence(doc);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate advanced intelligence report." },
      { status: 500 }
    );
  }
}
