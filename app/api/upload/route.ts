import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/security/auth";
import { validateUploadedFile } from "@/lib/security/file-guard";
import { extractDocumentContent } from "@/lib/parsers";
import { detectDocumentSections } from "@/lib/rag/section-detector";
import { chunkDocumentSections } from "@/lib/rag/chunker";
import { getAIProvider } from "@/lib/ai/provider";
import { saveDocument } from "@/lib/store/document-store";
import { LegalDocument } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No document file was provided in the request." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateUploadedFile(file.name, file.size, file.type, buffer);

    if (!validation.valid || !validation.normalizedExtension) {
      return NextResponse.json(
        { error: validation.error || "Invalid file format or attributes." },
        { status: 400 }
      );
    }

    // 1. Text Extraction
    const extraction = await extractDocumentContent(buffer, validation.normalizedExtension);
    if (!extraction.rawText || extraction.rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract readable text from document. Ensure file is not empty or password protected." },
        { status: 422 }
      );
    }

    // 2. Section Detection
    const sections = detectDocumentSections(extraction.rawText, extraction.pageCount);
    
    // 3. Structured Chunking
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const chunks = chunkDocumentSections(docId, sections);

    // 4. AI Document Analysis
    const aiProvider = getAIProvider();
    const analysis = await aiProvider.analyzeDocument(extraction.rawText, sections, file.name);

    const docType = validation.normalizedExtension.replace(".", "") as "pdf" | "docx" | "txt";

    const legalDoc: LegalDocument = {
      id: docId,
      userId: session.userId,
      fileName: file.name,
      fileType: docType,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      status: "analyzed",
      rawText: extraction.rawText,
      sections,
      chunks,
      summary: analysis.summary,
      findings: analysis.findings,
      clauses: analysis.clauses,
    };

    await saveDocument(legalDoc);

    return NextResponse.json({
      success: true,
      documentId: legalDoc.id,
      document: legalDoc,
    });
  } catch {
    return NextResponse.json(
      { error: "We couldn't analyze this document. Please check the file and try again." },
      { status: 500 }
    );
  }
}
