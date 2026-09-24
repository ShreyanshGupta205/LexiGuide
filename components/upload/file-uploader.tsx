"use client";

import * as React from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS } from "@/lib/security/file-guard";

interface FileUploaderProps {
  onUploadSuccess?: (documentId: string) => void;
  className?: string;
}

const PROCESSING_STEPS = [
  "Uploading document securely",
  "Extracting text & page markers",
  "Detecting legal sections & hierarchy",
  "Analyzing clauses & obligations",
  "Generating insights & citations",
];

export function FileUploader({ onUploadSuccess, className }: FileUploaderProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const validateFileLocally = (file: File): string | null => {
    if (!file) return "No file selected.";
    if (file.size <= 0) return "File is empty (0 bytes).";
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds maximum allowed size of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`;
    }

    const lowerName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      return "Unsupported file format. Please upload a PDF, DOCX, or TXT document.";
    }

    return null;
  };

  const processUpload = async (file: File) => {
    const error = validateFileLocally(file);
    if (error) {
      setErrorMessage(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setIsProcessing(true);
    setCurrentStepIndex(0);

    // Multi-stage progress animation timer
    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(stepTimer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze document.");
      }

      const data = await res.json();
      setCurrentStepIndex(PROCESSING_STEPS.length);

      if (onUploadSuccess) {
        onUploadSuccess(data.documentId);
      } else {
        router.push(`/documents/${data.documentId}`);
      }
    } catch (err) {
      clearInterval(stepTimer);
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : "We couldn't analyze this document. Please try again.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={className}>
      {!isProcessing ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload document area. Drop PDF, DOCX, or TXT file here or press Enter to browse files."
          className={`flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-primary-600 bg-primary-50/70 scale-[1.005]"
              : "border-slate-300 hover:border-primary-400 bg-slate-50/60 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processUpload(e.target.files[0]);
              }
            }}
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-900 border border-slate-200 shadow-xs mb-4">
            <UploadCloud className="h-7 w-7 text-primary-800" aria-hidden="true" />
          </div>

          <h3 className="text-base font-semibold text-slate-900 text-center mb-1">
            Upload a legal document
          </h3>
          <p className="text-xs text-slate-500 text-center mb-4 max-w-sm">
            Drag and drop your file here, or click to browse. Supported formats: <strong>PDF, DOCX, or TXT</strong> (up to 10MB).
          </p>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="shadow-xs"
          >
            Select Document
          </Button>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg max-w-md w-full"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        /* Progress & Loading State during Processing */
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center p-8 sm:p-10 border border-slate-200 bg-white rounded-2xl shadow-sm text-center max-w-lg mx-auto"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 border border-primary-100 mb-4">
            <Loader2 className="h-7 w-7 animate-spin text-primary-800" aria-hidden="true" />
          </div>

          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Analyzing {selectedFile?.name || "document"}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Extracting text, structuring clauses, and checking source evidence...
          </p>

          <div className="w-full space-y-2.5 text-left max-w-sm">
            {PROCESSING_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    isCurrent
                      ? "bg-primary-50 text-primary-950 font-medium"
                      : isCompleted
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-primary-700 animate-spin shrink-0" aria-hidden="true" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
