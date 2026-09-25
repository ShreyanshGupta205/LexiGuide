import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { LegalDocument } from "@/lib/types";
import { DEMO_USER_ID, verifyDocumentOwnership } from "@/lib/security/auth";

let sqlInstance: NeonQueryFunction<false, false> | null = null;
let schemaInitialized = false;

/**
 * Returns true if a Neon database connection string is provided in the environment
 */
export function isNeonConfigured(): boolean {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  return !!url && (url.startsWith("postgres://") || url.startsWith("postgresql://"));
}

/**
 * Returns the active Neon SQL query client
 */
export function getNeonSql(): NeonQueryFunction<false, false> | null {
  if (!isNeonConfigured()) {
    return null;
  }

  if (!sqlInstance) {
    const url = (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL)!;
    sqlInstance = neon(url);
  }

  return sqlInstance;
}

/**
 * Automatically creates tables on the Neon PostgreSQL instance if they don't already exist
 */
export async function initNeonSchema(): Promise<void> {
  if (schemaInitialized) return;
  const sql = getNeonSql();
  if (!sql) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER NOT NULL,
        upload_date VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        raw_text TEXT NOT NULL,
        sections JSONB NOT NULL,
        chunks JSONB NOT NULL,
        summary JSONB,
        findings JSONB,
        clauses JSONB,
        error_message TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS qa_history (
        id VARCHAR(255) PRIMARY KEY,
        document_id VARCHAR(255) REFERENCES documents(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        evidence TEXT NOT NULL,
        source JSONB NOT NULL,
        confidence VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // High-performance B-tree indexes to optimize user queries and prevent full table scans
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_qa_doc_id ON qa_history(document_id);`;

    schemaInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Neon schema:", error);
  }
}

/**
 * Saves a document to Neon PostgreSQL
 */
export async function neonSaveDocument(doc: LegalDocument): Promise<void> {
  const sql = getNeonSql();
  if (!sql) return;

  await initNeonSchema();

  await sql`
    INSERT INTO documents (
      id, user_id, file_name, file_type, file_size, upload_date, status,
      raw_text, sections, chunks, summary, findings, clauses, error_message
    ) VALUES (
      ${doc.id}, ${doc.userId}, ${doc.fileName}, ${doc.fileType}, ${doc.fileSize},
      ${doc.uploadDate}, ${doc.status}, ${doc.rawText},
      ${JSON.stringify(doc.sections)}, ${JSON.stringify(doc.chunks)},
      ${doc.summary ? JSON.stringify(doc.summary) : null},
      ${doc.findings ? JSON.stringify(doc.findings) : null},
      ${doc.clauses ? JSON.stringify(doc.clauses) : null},
      ${doc.errorMessage || null}
    )
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      summary = EXCLUDED.summary,
      findings = EXCLUDED.findings,
      clauses = EXCLUDED.clauses,
      error_message = EXCLUDED.error_message;
  `;
}

/**
 * Retrieves a document from Neon with ownership checks
 */
export async function neonGetDocument(id: string, userId: string): Promise<LegalDocument | null> {
  const sql = getNeonSql();
  if (!sql) return null;

  await initNeonSchema();

  const rows = await sql`
    SELECT * FROM documents WHERE id = ${id} LIMIT 1;
  `;

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const isOwner = verifyDocumentOwnership(row.user_id, {
    userId,
    email: "",
    name: "",
    isDemoUser: userId === DEMO_USER_ID || userId.startsWith("demo-"),
  });

  if (!isOwner) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    uploadDate: row.upload_date,
    status: row.status,
    rawText: row.raw_text,
    sections: typeof row.sections === "string" ? JSON.parse(row.sections) : row.sections,
    chunks: typeof row.chunks === "string" ? JSON.parse(row.chunks) : row.chunks,
    summary: typeof row.summary === "string" ? JSON.parse(row.summary) : row.summary,
    findings: typeof row.findings === "string" ? JSON.parse(row.findings) : row.findings,
    clauses: typeof row.clauses === "string" ? JSON.parse(row.clauses) : row.clauses,
    errorMessage: row.error_message,
  };
}

/**
 * Lists documents for a user from Neon
 */
export async function neonListDocuments(userId: string): Promise<LegalDocument[]> {
  const sql = getNeonSql();
  if (!sql) return [];

  await initNeonSchema();

  const isDemo = userId === DEMO_USER_ID || userId.startsWith("demo-");

  const rows = await sql`
    SELECT id, user_id, file_name, file_type, file_size, upload_date, status,
           summary, findings, clauses
    FROM documents
    WHERE user_id = ${userId} OR (${isDemo} AND user_id = ${DEMO_USER_ID})
    ORDER BY upload_date DESC;
  `;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    uploadDate: row.upload_date,
    status: row.status,
    rawText: "",
    sections: [],
    chunks: [],
    summary: typeof row.summary === "string" ? JSON.parse(row.summary) : row.summary,
    findings: typeof row.findings === "string" ? JSON.parse(row.findings) : row.findings,
    clauses: typeof row.clauses === "string" ? JSON.parse(row.clauses) : row.clauses,
  }));
}

/**
 * Deletes a document from Neon
 */
export async function neonDeleteDocument(id: string, userId: string): Promise<boolean> {
  const sql = getNeonSql();
  if (!sql) return false;

  await initNeonSchema();

  const isDemo = userId === DEMO_USER_ID || userId.startsWith("demo-");

  const result = await sql`
    DELETE FROM documents
    WHERE id = ${id} AND (user_id = ${userId} OR (${isDemo} AND user_id = ${DEMO_USER_ID}))
    RETURNING id;
  `;

  return result.length > 0;
}
