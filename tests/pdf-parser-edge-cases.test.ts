import { describe, it, expect, vi } from "vitest";
import { parsePdfBuffer } from "../lib/parsers/pdf-parser";
import pdfParse from "pdf-parse";

vi.mock("pdf-parse");

describe("PDF Parser Edge Cases & OCR Detection", () => {
  it("extracts text and computes page count for valid digital PDFs", async () => {
    vi.mocked(pdfParse).mockResolvedValueOnce({
      numpages: 2,
      numrender: 2,
      info: {},
      metadata: null,
      version: "v1.10.100",
      text: "This Master Services Agreement is entered into by and between Acme Corp and Consultant on October 1, 2026.",
    });

    const mockBuffer = Buffer.from("%PDF-1.4 dummy pdf data");
    const result = await parsePdfBuffer(mockBuffer);

    expect(result.pageCount).toBe(2);
    expect(result.rawText).toContain("Master Services Agreement");
    expect(result.rawText).toContain("Acme Corp");
  });

  it("detects scanned PDFs without OCR embedded text layers and throws descriptive error", async () => {
    vi.mocked(pdfParse).mockResolvedValueOnce({
      numpages: 5,
      numrender: 5,
      info: {},
      metadata: null,
      version: "v1.10.100",
      text: "   \n\n ", // Scanned document with no extractable text
    });

    const mockBuffer = Buffer.from("%PDF-1.4 scanned image dummy");

    await expect(parsePdfBuffer(mockBuffer)).rejects.toThrow(
      /scanned image without an embedded text layer \(OCR\)/
    );
  });

  it("handles corrupted or malformed buffers gracefully with error prefix", async () => {
    vi.mocked(pdfParse).mockRejectedValueOnce(new Error("Invalid PDF header signature"));

    const badBuffer = Buffer.from("Not a real PDF file");

    await expect(parsePdfBuffer(badBuffer)).rejects.toThrow(
      /PDF parsing failed: Invalid PDF header signature/
    );
  });

  it("normalizes CRLF and mixed line endings cleanly", async () => {
    vi.mocked(pdfParse).mockResolvedValueOnce({
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: null,
      version: "v1.10.100",
      text: "Section 1\r\nObligations\rPayment terms in 30 days\r\nSection 2",
    });

    const mockBuffer = Buffer.from("%PDF-1.4 line endings");
    const result = await parsePdfBuffer(mockBuffer);

    expect(result.rawText).not.toContain("\r\n");
    expect(result.rawText).not.toContain("\r");
    expect(result.rawText).toContain("Section 1\nObligations\nPayment terms in 30 days\nSection 2");
  });
});
