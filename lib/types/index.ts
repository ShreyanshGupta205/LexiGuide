import { z } from "zod";

export type AttentionLevel = "INFORMATION" | "IMPORTANT" | "NEEDS_ATTENTION";

export type ClauseCategory =
  | "obligations"
  | "payments"
  | "termination"
  | "confidentiality"
  | "intellectual_property"
  | "liability"
  | "renewal"
  | "dispute_resolution"
  | "governing_law"
  | "other";

export interface SourceReference {
  page: number;
  section: string;
  chunkId?: string;
  originalText?: string;
}

export interface ClauseAnalysis {
  id: string;
  title: string;
  clauseType: ClauseCategory | string;
  explanation: string;
  appliesTo: string;
  obligations: string[];
  importantDates: string[];
  attentionLevel: AttentionLevel;
  potentialQuestions: string[];
  source: SourceReference;
}

export interface DocumentSummary {
  documentType: string;
  parties: string[];
  effectiveDate: string;
  duration: string;
  importantDates: string[];
  majorObligations: string[];
  majorSections: string[];
}

export interface KeyFinding {
  id: string;
  category: ClauseCategory;
  categoryLabel: string;
  title: string;
  content: string;
  attentionLevel: AttentionLevel;
  source: SourceReference;
}

export interface DocumentSection {
  id: string;
  title: string;
  sectionNumber: string;
  page: number;
  content: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  page: number;
  section: string;
  clauseType: string;
  text: string;
  tokenCount?: number;
}

export interface LegalDocument {
  id: string;
  userId: string;
  fileName: string;
  fileType: "pdf" | "docx" | "txt";
  fileSize: number;
  uploadDate: string;
  status: "uploaded" | "extracting" | "detecting" | "analyzing" | "analyzed" | "error";
  rawText: string;
  sections: DocumentSection[];
  chunks: DocumentChunk[];
  summary?: DocumentSummary;
  findings?: KeyFinding[];
  clauses?: ClauseAnalysis[];
  errorMessage?: string;
}

export interface QAInteraction {
  id: string;
  documentId: string;
  question: string;
  answer: string;
  evidence: string;
  source: {
    documentName: string;
    page: number;
    section: string;
    chunkId?: string;
  };
  timestamp: string;
  confidence?: "high" | "moderate" | "unsupported";
}

export interface ComparisonCategoryRow {
  category: string;
  docAValue: string;
  docBValue: string;
  docASource?: SourceReference;
  docBSource?: SourceReference;
  changeType: "added" | "removed" | "modified" | "unchanged";
}

export interface ComparisonDifference {
  id: string;
  category: string;
  title: string;
  explanation: string;
  impactLevel: "low" | "medium" | "high";
  docASource?: SourceReference;
  docBSource?: SourceReference;
}

export interface DocumentComparisonResult {
  docAId: string;
  docAName: string;
  docBId: string;
  docBName: string;
  overview: string;
  matrix: ComparisonCategoryRow[];
  differences: ComparisonDifference[];
}

export interface ConsultationChecklistItem {
  id: string;
  text: string;
  description?: string;
  checked: boolean;
  category: "documents" | "information";
}

export interface ConsultationBrief {
  documentId: string;
  documentName: string;
  generatedDate: string;
  situationSummary: string;
  importantProvisions: {
    title: string;
    summary: string;
    attentionLevel: AttentionLevel;
    source: SourceReference;
  }[];
  questionsToAsk: string[];
  documentsToBring: ConsultationChecklistItem[];
  informationToPrepare: ConsultationChecklistItem[];
  disclaimer: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  isDemoUser: boolean;
}
