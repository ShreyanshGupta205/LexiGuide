/**
 * File validation and security verification for uploads
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;
export type AllowedExtension = typeof ALLOWED_EXTENSIONS[number];

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/octet-stream", // Fallback for raw streams, verified by extension and header
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  normalizedExtension?: AllowedExtension;
}

/**
 * Validates a file's name, size, extension, and content buffer.
 */
export function validateUploadedFile(
  fileName: string,
  fileSize: number,
  mimeType: string,
  buffer?: Buffer
): FileValidationResult {
  if (!fileName || typeof fileName !== "string") {
    return { valid: false, error: "File name is required." };
  }

  // Prevent path traversal
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return { valid: false, error: "Invalid file name characters detected." };
  }

  if (fileSize <= 0) {
    return { valid: false, error: "File is empty (0 bytes). Please upload a valid document." };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of 10MB (${(fileSize / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const lowerName = fileName.toLowerCase();
  const extMatch = ALLOWED_EXTENSIONS.find((ext) => lowerName.endsWith(ext));

  if (!extMatch) {
    return {
      valid: false,
      error: `Unsupported file format. LexiGuide supports PDF, DOCX, and TXT files only.`,
    };
  }

  // Magic byte checks if buffer is available
  if (buffer && buffer.length > 4) {
    if (extMatch === ".pdf") {
      // PDF magic bytes %PDF (0x25, 0x50, 0x44, 0x46)
      const isPdfHeader =
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46;
      if (!isPdfHeader) {
        return { valid: false, error: "Malformed PDF file: invalid header signatures." };
      }
    } else if (extMatch === ".docx") {
      // ZIP / OOXML magic bytes PK.. (0x50, 0x4B, 0x03, 0x04)
      const isZipHeader =
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04;
      if (!isZipHeader) {
        return { valid: false, error: "Malformed DOCX file: invalid package structure." };
      }
    }
  }

  return {
    valid: true,
    normalizedExtension: extMatch,
  };
}
