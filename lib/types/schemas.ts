import { z } from "zod";

export const AttentionLevelSchema = z.enum(["INFORMATION", "IMPORTANT", "NEEDS_ATTENTION"]);

export const SourceReferenceSchema = z.object({
  page: z.number().int().min(1).default(1),
  section: z.string().min(1).default("General"),
  chunkId: z.string().optional(),
  originalText: z.string().optional(),
});

export const DocumentSummarySchema = z.object({
  documentType: z.string().min(1),
  parties: z.array(z.string()).min(1),
  effectiveDate: z.string().default("Not specified"),
  duration: z.string().default("Not specified"),
  importantDates: z.array(z.string()).default([]),
  majorObligations: z.array(z.string()).default([]),
  majorSections: z.array(z.string()).default([]),
});

export const ClauseAnalysisSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  title: z.string().min(1),
  clauseType: z.string().min(1),
  explanation: z.string().min(1),
  appliesTo: z.string().min(1),
  obligations: z.array(z.string()).default([]),
  importantDates: z.array(z.string()).default([]),
  attentionLevel: AttentionLevelSchema,
  potentialQuestions: z.array(z.string()).default([]),
  source: SourceReferenceSchema,
});

export const KeyFindingSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  category: z.enum([
    "obligations",
    "payments",
    "termination",
    "confidentiality",
    "intellectual_property",
    "liability",
    "renewal",
    "dispute_resolution",
    "governing_law",
    "other",
  ]),
  categoryLabel: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  attentionLevel: AttentionLevelSchema,
  source: SourceReferenceSchema,
});

export const FullDocumentAnalysisSchema = z.object({
  summary: DocumentSummarySchema,
  findings: z.array(KeyFindingSchema),
  clauses: z.array(ClauseAnalysisSchema),
});

export const QAAnswerSchema = z.object({
  answer: z.string().min(1),
  evidence: z.string().default(""),
  source: z.object({
    page: z.number().int().min(1).default(1),
    section: z.string().default("General"),
    chunkId: z.string().optional(),
  }),
  isSupportedByDocument: z.boolean().default(true),
});

export const ComparisonDifferenceSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  category: z.string(),
  title: z.string(),
  explanation: z.string(),
  impactLevel: z.enum(["low", "medium", "high"]),
  docASource: SourceReferenceSchema.optional(),
  docBSource: SourceReferenceSchema.optional(),
});

export const ComparisonMatrixRowSchema = z.object({
  category: z.string(),
  docAValue: z.string(),
  docBValue: z.string(),
  docASource: SourceReferenceSchema.optional(),
  docBSource: SourceReferenceSchema.optional(),
  changeType: z.enum(["added", "removed", "modified", "unchanged"]),
});

export const DocumentComparisonResponseSchema = z.object({
  overview: z.string(),
  matrix: z.array(ComparisonMatrixRowSchema),
  differences: z.array(ComparisonDifferenceSchema),
});

export const ConsultationBriefSchema = z.object({
  situationSummary: z.string(),
  importantProvisions: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      attentionLevel: AttentionLevelSchema,
      source: SourceReferenceSchema,
    })
  ),
  questionsToAsk: z.array(z.string()),
  documentsToBring: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      description: z.string().optional(),
      checked: z.boolean().default(false),
      category: z.literal("documents"),
    })
  ),
  informationToPrepare: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      description: z.string().optional(),
      checked: z.boolean().default(false),
      category: z.literal("information"),
    })
  ),
});
