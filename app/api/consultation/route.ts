import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { getDocument } from "@/lib/store/document-store";
import { getAIProvider } from "@/lib/ai/provider";

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

    const aiProvider = getAIProvider();
    const brief = await aiProvider.generateConsultationBrief(doc);

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate consultation brief." },
      { status: 500 }
    );
  }
}
