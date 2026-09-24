import { parseTxtBuffer } from "./txt-parser";
import { parseDocxBuffer } from "./docx-parser";
import { parsePdfBuffer } from "./pdf-parser";
import { AllowedExtension } from "@/lib/security/file-guard";

export interface ExtractedDocumentContent {
  rawText: string;
  pageCount: number;
}

/**
 * Dispatches buffer to appropriate parser based on extension
 */
export async function extractDocumentContent(
  buffer: Buffer,
  extension: AllowedExtension
): Promise<ExtractedDocumentContent> {
  switch (extension) {
    case ".txt":
      return parseTxtBuffer(buffer);
    case ".docx":
      return parseDocxBuffer(buffer);
    case ".pdf":
      return parsePdfBuffer(buffer);
    default:
      throw new Error(`Unsupported file extension: ${extension}`);
  }
}
