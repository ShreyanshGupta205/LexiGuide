/**
 * Plain text document parser with line break and whitespace normalization
 */

export function parseTxtBuffer(buffer: Buffer): { rawText: string; pageCount: number } {
  const text = buffer.toString("utf-8");
  // Normalize Windows CRLF and trailing spaces
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  
  // Approximate pages (standard 2500 chars / ~500 words per page)
  const pageCount = Math.max(1, Math.ceil(normalized.length / 2500));

  return {
    rawText: normalized,
    pageCount,
  };
}
