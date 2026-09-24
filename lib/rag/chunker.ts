import { DocumentChunk, DocumentSection } from "@/lib/types";
import { classifyClauseType } from "./section-detector";

/**
 * Creates structured chunks with full metadata for RAG retrieval and citations
 */
export function chunkDocumentSections(
  documentId: string,
  sections: DocumentSection[]
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkCounter = 0;

  for (const section of sections) {
    const clauseType = classifyClauseType(section.content, section.title);
    
    // Split section content into logical blocks/paragraphs
    const paragraphs = section.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    if (paragraphs.length === 0) {
      if (section.content.trim().length > 0) {
        chunks.push({
          id: `chk-${documentId}-${++chunkCounter}`,
          documentId,
          page: section.page,
          section: section.title,
          clauseType,
          text: section.content.trim(),
          tokenCount: Math.ceil(section.content.length / 4),
        });
      }
      continue;
    }

    // Merge or split paragraphs to stay within ~200-500 words per chunk
    let currentChunkText = "";
    
    for (const para of paragraphs) {
      if ((currentChunkText + " " + para).length > 1800 && currentChunkText.length > 200) {
        chunks.push({
          id: `chk-${documentId}-${++chunkCounter}`,
          documentId,
          page: section.page,
          section: section.title,
          clauseType: classifyClauseType(currentChunkText, section.title),
          text: currentChunkText.trim(),
          tokenCount: Math.ceil(currentChunkText.length / 4),
        });
        currentChunkText = para;
      } else {
        currentChunkText = currentChunkText ? `${currentChunkText}\n\n${para}` : para;
      }
    }

    if (currentChunkText.trim().length > 0) {
      chunks.push({
        id: `chk-${documentId}-${++chunkCounter}`,
        documentId,
        page: section.page,
        section: section.title,
        clauseType: classifyClauseType(currentChunkText, section.title),
        text: currentChunkText.trim(),
        tokenCount: Math.ceil(currentChunkText.length / 4),
      });
    }
  }

  return chunks;
}
