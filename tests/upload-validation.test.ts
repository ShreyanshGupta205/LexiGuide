import { describe, it, expect } from "vitest";
import { validateUploadedFile, MAX_FILE_SIZE_BYTES } from "@/lib/security/file-guard";

describe("Document Upload & Security Guard Tests", () => {
  it("approves valid PDF, DOCX, and TXT files within size limits", () => {
    const validTxt = validateUploadedFile("contract.txt", 1024, "text/plain");
    expect(validTxt.valid).toBe(true);
    expect(validTxt.normalizedExtension).toBe(".txt");

    const validDocx = validateUploadedFile("agreement.docx", 50000, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(validDocx.valid).toBe(true);
    expect(validDocx.normalizedExtension).toBe(".docx");

    const validPdf = validateUploadedFile("lease.pdf", 120000, "application/pdf");
    expect(validPdf.valid).toBe(true);
    expect(validPdf.normalizedExtension).toBe(".pdf");
  });

  it("rejects files exceeding 10MB size limit", () => {
    const oversized = validateUploadedFile("huge.pdf", MAX_FILE_SIZE_BYTES + 1024, "application/pdf");
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toContain("exceeds maximum allowed size of 10MB");
  });

  it("rejects empty 0-byte files", () => {
    const emptyFile = validateUploadedFile("empty.txt", 0, "text/plain");
    expect(emptyFile.valid).toBe(false);
    expect(emptyFile.error).toContain("File is empty");
  });

  it("rejects dangerous or unsupported file extensions", () => {
    const exeFile = validateUploadedFile("malware.exe", 2048, "application/x-msdownload");
    expect(exeFile.valid).toBe(false);
    expect(exeFile.error).toContain("Unsupported file format");

    const jsFile = validateUploadedFile("script.js", 1024, "application/javascript");
    expect(jsFile.valid).toBe(false);
  });

  it("prevents path traversal attempts in file names", () => {
    const traversal = validateUploadedFile("../../etc/passwd.pdf", 1024, "application/pdf");
    expect(traversal.valid).toBe(false);
    expect(traversal.error).toContain("Invalid file name characters detected");
  });

  it("detects and rejects spoofed PDF files with fake extensions but invalid magic bytes", () => {
    const fakePdfBuffer = Buffer.from("NOT_A_REAL_PDF_HEADER_JUST_RANDOM_TEXT");
    const result = validateUploadedFile("contract.pdf", fakePdfBuffer.length, "application/pdf", fakePdfBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Malformed PDF file: invalid header signatures");
  });

  it("detects and rejects spoofed DOCX files with invalid ZIP/OOXML magic bytes", () => {
    const fakeDocxBuffer = Buffer.from("NOT_A_ZIP_ARCHIVE_DATA");
    const result = validateUploadedFile("agreement.docx", fakeDocxBuffer.length, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fakeDocxBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Malformed DOCX file: invalid package structure");
  });

  it("accepts valid PDF files with proper %PDF magic header bytes", () => {
    const validPdfBuffer = Buffer.from("%PDF-1.4 sample pdf content");
    const result = validateUploadedFile("valid.pdf", validPdfBuffer.length, "application/pdf", validPdfBuffer);
    expect(result.valid).toBe(true);
    expect(result.normalizedExtension).toBe(".pdf");
  });
});
