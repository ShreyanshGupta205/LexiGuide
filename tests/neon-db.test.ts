import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isNeonConfigured } from "@/lib/db/neon";
import { getDocument, listDocuments } from "@/lib/store/document-store";

describe("Neon PostgreSQL Database Integration Tests", () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it("returns false when DATABASE_URL is not set", () => {
    delete process.env.DATABASE_URL;
    delete process.env.NEON_DATABASE_URL;
    expect(isNeonConfigured()).toBe(false);
  });

  it("returns true when a valid Neon postgres connection string is provided", () => {
    process.env.DATABASE_URL = "postgresql://user:secret@ep-demo.us-east-2.aws.neon.tech/neondb?sslmode=require";
    expect(isNeonConfigured()).toBe(true);
  });

  it("gracefully falls back to demo and local memory store when Neon is not connected", async () => {
    delete process.env.DATABASE_URL;
    const docs = await listDocuments("demo-user-lexiguide");
    expect(docs.length).toBeGreaterThanOrEqual(2);

    const doc1 = await getDocument("demo-doc-1", "demo-user-lexiguide");
    expect(doc1).not.toBeNull();
    expect(doc1?.fileName).toContain("Acme_Innovations");
  });
});
