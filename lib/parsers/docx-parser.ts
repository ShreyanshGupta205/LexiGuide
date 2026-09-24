import mammoth from "mammoth";

/**
 * Extracts plain text from a DOCX buffer using mammoth
 */
export async function parseDocxBuffer(buffer: Buffer): Promise<{ rawText: string; pageCount: number }> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const normalized = result.value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    
    // Approximate page count
    const pageCount = Math.max(1, Math.ceil(normalized.length / 2500));

    return {
      rawText: normalized,
      pageCount,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to extract DOCX text";
    throw new Error(`DOCX parsing failed: ${msg}`);
  }
}
