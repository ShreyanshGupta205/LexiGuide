import { LegalDocument } from "@/lib/types";
import { DEMO_USER_ID, verifyDocumentOwnership } from "@/lib/security/auth";
import { SAMPLE_EMPLOYMENT_AGREEMENT_V1, SAMPLE_EMPLOYMENT_AGREEMENT_V2 } from "@/lib/sample-data/demo-contracts";
import { detectDocumentSections } from "@/lib/rag/section-detector";
import { chunkDocumentSections } from "@/lib/rag/chunker";
import { LocalAIProvider } from "@/lib/ai/local-provider";
import {
  isNeonConfigured,
  neonSaveDocument,
  neonGetDocument,
  neonListDocuments,
  neonDeleteDocument,
} from "@/lib/db/neon";

// Global cache to maintain store across Next.js API re-evaluations
const globalForDocs = globalThis as unknown as {
  lexiDocumentStore: Map<string, LegalDocument> | undefined;
};

export const documentStore = globalForDocs.lexiDocumentStore ?? new Map<string, LegalDocument>();
if (process.env.NODE_ENV !== "production") {
  globalForDocs.lexiDocumentStore = documentStore;
}

const localAI = new LocalAIProvider();

/**
 * Initializes realistic sample documents for demo mode
 */
export async function seedDemoDocuments(): Promise<void> {
  if (documentStore.has("demo-doc-1") && documentStore.has("demo-doc-2")) {
    return;
  }

  // Seed Doc 1: Acme Innovations Executive Agreement (2025)
  const rawText1 = SAMPLE_EMPLOYMENT_AGREEMENT_V1;
  const sections1 = detectDocumentSections(rawText1, 4);
  const chunks1 = chunkDocumentSections("demo-doc-1", sections1);
  const analysis1 = await localAI.analyzeDocument(rawText1, sections1, "Acme_Innovations_Employment_Agreement_2025.txt");

  const doc1: LegalDocument = {
    id: "demo-doc-1",
    userId: DEMO_USER_ID,
    fileName: "Acme_Innovations_Employment_Agreement_2025.txt",
    fileType: "txt",
    fileSize: Buffer.byteLength(rawText1, "utf-8"),
    uploadDate: "2025-01-15T10:00:00.000Z",
    status: "analyzed",
    rawText: rawText1,
    sections: sections1,
    chunks: chunks1,
    summary: analysis1.summary,
    findings: analysis1.findings,
    clauses: analysis1.clauses,
  };

  // Seed Doc 2: Acme Innovations Revised Agreement v2 (2026)
  const rawText2 = SAMPLE_EMPLOYMENT_AGREEMENT_V2;
  const sections2 = detectDocumentSections(rawText2, 4);
  const chunks2 = chunkDocumentSections("demo-doc-2", sections2);
  const analysis2 = await localAI.analyzeDocument(rawText2, sections2, "Acme_Innovations_Employment_Agreement_v2_2026.txt");

  const doc2: LegalDocument = {
    id: "demo-doc-2",
    userId: DEMO_USER_ID,
    fileName: "Acme_Innovations_Employment_Agreement_v2_2026.txt",
    fileType: "txt",
    fileSize: Buffer.byteLength(rawText2, "utf-8"),
    uploadDate: "2026-02-01T14:30:00.000Z",
    status: "analyzed",
    rawText: rawText2,
    sections: sections2,
    chunks: chunks2,
    summary: analysis2.summary,
    findings: analysis2.findings,
    clauses: analysis2.clauses,
  };

  documentStore.set(doc1.id, doc1);
  documentStore.set(doc2.id, doc2);

  // If Neon is configured, sync demo documents to PostgreSQL
  if (isNeonConfigured()) {
    try {
      await neonSaveDocument(doc1);
      await neonSaveDocument(doc2);
    } catch {
      // Non-blocking sync
    }
  }
}

/**
 * Returns documents accessible to the given user ID
 */
export async function listDocuments(userId: string): Promise<LegalDocument[]> {
  await seedDemoDocuments();

  // If Neon Postgres is configured, query database
  if (isNeonConfigured()) {
    try {
      const dbDocs = await neonListDocuments(userId);
      if (dbDocs.length > 0) {
        return dbDocs;
      }
    } catch (e) {
      console.warn("Neon query failed, using in-memory fallback:", e);
    }
  }

  const results: LegalDocument[] = [];
  Array.from(documentStore.values()).forEach((doc) => {
    if (doc.userId === userId || (doc.userId === DEMO_USER_ID && (userId === DEMO_USER_ID || userId.startsWith("demo-")))) {
      results.push(doc);
    }
  });

  return results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
}

/**
 * Retrieves a document by ID with strict ownership validation
 */
export async function getDocument(id: string, userId: string): Promise<LegalDocument | null> {
  await seedDemoDocuments();

  // If Neon is configured, retrieve from Postgres
  if (isNeonConfigured()) {
    try {
      const dbDoc = await neonGetDocument(id, userId);
      if (dbDoc) {
        return dbDoc;
      }
    } catch (e) {
      console.warn("Neon document fetch error, falling back to cache:", e);
    }
  }

  const doc = documentStore.get(id);
  if (!doc) {
    return null;
  }

  const isOwner = verifyDocumentOwnership(doc.userId, {
    userId,
    email: "",
    name: "",
    isDemoUser: userId === DEMO_USER_ID || userId.startsWith("demo-"),
  });

  if (!isOwner) {
    return null;
  }

  return doc;
}

/**
 * Saves or updates a document
 */
export async function saveDocument(doc: LegalDocument): Promise<void> {
  // Always update in-memory cache for fast local responses
  documentStore.set(doc.id, doc);

  // If Neon is configured, persist in Postgres
  if (isNeonConfigured()) {
    try {
      await neonSaveDocument(doc);
    } catch (e) {
      console.error("Failed to persist document to Neon:", e);
    }
  }
}

/**
 * Deletes a document and cascades associated data
 */
export async function deleteDocument(id: string, userId: string): Promise<boolean> {
  await seedDemoDocuments();

  let deletedFromNeon = false;
  if (isNeonConfigured()) {
    try {
      deletedFromNeon = await neonDeleteDocument(id, userId);
    } catch (e) {
      console.warn("Neon delete failed:", e);
    }
  }

  const doc = documentStore.get(id);
  if (!doc) {
    return deletedFromNeon;
  }

  const isOwner = verifyDocumentOwnership(doc.userId, {
    userId,
    email: "",
    name: "",
    isDemoUser: userId === DEMO_USER_ID || userId.startsWith("demo-"),
  });

  if (!isOwner) {
    return false;
  }

  documentStore.delete(id);
  return true;
}
