import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { deleteDocument, getDocument } from "@/lib/store/document-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getCurrentSession(req);
    const doc = await getDocument(params.id, session.userId);

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found or you do not have permission to access it." },
        { status: 404 }
      );
    }

    return NextResponse.json({ document: doc });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve document details." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getCurrentSession(req);
    const success = await deleteDocument(params.id, session.userId);

    if (!success) {
      return NextResponse.json(
        { error: "Document not found or you do not have authorization to delete it." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document and all associated analysis data were permanently deleted.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete document." },
      { status: 500 }
    );
  }
}
