import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { getDocument } from "@/lib/store/document-store";
import { LocalAIProvider } from "@/lib/ai/local-provider";

const localAI = new LocalAIProvider();

export async function POST(req: NextRequest) {
  try {
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate advanced intelligence report." },
      { status: 500 }
    );
  }
}
