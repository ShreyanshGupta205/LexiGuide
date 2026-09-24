import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { listDocuments } from "@/lib/store/document-store";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    const documents = await listDocuments(session.userId);

    // Return sanitized document summaries for list view
    const sanitized = documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadDate: doc.uploadDate,
      status: doc.status,
      findingsCount: doc.findings?.length || 0,
      clausesCount: doc.clauses?.length || 0,
      summary: doc.summary,
    }));

    return NextResponse.json({
      documents: sanitized,
      user: {
        userId: session.userId,
        isDemoUser: session.isDemoUser,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve documents." },
      { status: 500 }
    );
  }
}
