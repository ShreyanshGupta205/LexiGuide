import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { getDocument } from "@/lib/store/document-store";
import { getAIProvider } from "@/lib/ai/provider";

import { checkRateLimit, getRateLimitKey } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 15 consultation brief requests per IP per minute
    const rateLimitKey = getRateLimitKey(req);
    const { allowed } = checkRateLimit(rateLimitKey, 15, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before generating another consultation brief." },
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

    const aiProvider = getAIProvider();
    const brief = await aiProvider.generateConsultationBrief(doc);

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate consultation brief." },
      { status: 500 }
    );
  }
}
