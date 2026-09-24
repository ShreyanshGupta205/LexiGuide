import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { getDocument } from "@/lib/store/document-store";
import { getAIProvider } from "@/lib/ai/provider";

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    const body = await req.json();

    const { docAId, docBId } = body;

    if (!docAId || !docBId) {
      return NextResponse.json(
        { error: "Both docAId and docBId must be provided for comparison." },
        { status: 400 }
      );
    }

    if (docAId === docBId) {
      return NextResponse.json(
        { error: "Please select two different documents to compare." },
        { status: 400 }
      );
    }

    const docA = await getDocument(docAId, session.userId);
    const docB = await getDocument(docBId, session.userId);

    if (!docA || !docB) {
      return NextResponse.json(
        { error: "One or both selected documents could not be found or access is unauthorized." },
        { status: 404 }
      );
    }

    const aiProvider = getAIProvider();
    const comparison = await aiProvider.compareDocuments(docA, docB);

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate document comparison." },
      { status: 500 }
    );
  }
}
