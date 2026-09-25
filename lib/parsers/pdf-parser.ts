import pdfParse from "pdf-parse";

/**
 * Extracts plain text and page metadata from a PDF buffer
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<{ rawText: string; pageCount: number }> {
  try {
    const data = await pdfParse(buffer);
    const normalized = (data.text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    const pageCount = Math.max(1, data.numpages || Math.ceil(normalized.length / 2500));

    // Scanned image detection: if multi-page PDF has zero extractable text
    if (pageCount >= 1 && normalized.length < 25) {
      throw new Error(
        "This PDF appears to be a scanned image without an embedded text layer (OCR). Please upload a searchable digital PDF, a DOCX file, or run OCR before uploading."
      );
    }

    return {
      rawText: normalized,
      pageCount,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to extract PDF text";
    throw new Error(`PDF parsing failed: ${msg}`);
  }
}
