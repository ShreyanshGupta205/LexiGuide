import { NextResponse } from "next/server";
import { seedDemoDocuments } from "@/lib/store/document-store";

export async function POST() {
  try {
    await seedDemoDocuments();
    return NextResponse.json({
      success: true,
      demoDocumentId: "demo-doc-1",
      compareDocumentId: "demo-doc-2",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to initialize demo experience." },
      { status: 500 }
    );
  }
}
