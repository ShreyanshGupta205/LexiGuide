"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquareQuote,
  Send,
  FileText,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { QAInteraction } from "@/lib/types";

export default function QuestionsPage() {
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = React.useState<string>("");
  const [questionInput, setQuestionInput] = React.useState("");
  const [isAsking, setIsAsking] = React.useState(false);
  const [qaHistory, setQaHistory] = React.useState<QAInteraction[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = React.useState(true);

  React.useEffect(() => {
    async function loadDocs() {
      try {
        setIsLoadingDocs(true);
        const res = await fetch("/api/documents");
        const data = await res.json();
        const docs = data.documents || [];
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocId(docs[0].id);
        }
      } catch {
        // Ignore
      } finally {
        setIsLoadingDocs(false);
      }
    }
    loadDocs();
  }, []);

  const handleAsk = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = (customQ || questionInput).trim();
    if (!query || isAsking || !selectedDocId) return;

    setIsAsking(true);
    setQuestionInput("");

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocId,
          question: query,
        }),
      });

      const data = await res.json();
      if (data.interaction) {
        setQaHistory((prev) => [data.interaction, ...prev]);
      }
    } catch {
      // Ignore
    } finally {
      setIsAsking(false);
    }
  };

  const EXAMPLE_QUESTIONS = [
    "What are the termination conditions?",
    "Who is responsible for payment?",
    "How long does this agreement last?",
    "What are my main obligations?",
    "Is there an intellectual property assignment?",
    "Is there a non-compete clause?",
  ];

  return (
    <div className="flex-1 flex">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Document Q&A
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Ask precise questions grounded in retrieved contractual provisions.
          </p>
        </div>

        {/* Question Input Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Ask about this document</CardTitle>
                <CardDescription className="text-xs">
                  Answers cite exact contractual passages and refuse to extrapolate ungrounded claims.
                </CardDescription>
              </div>

              {/* Document Selector */}
              <div className="w-full sm:w-72">
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                  aria-label="Select document to query"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fileName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Example Questions */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Suggested Inquiries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(undefined, q)}
                    disabled={isAsking || !selectedDocId}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-primary-50 hover:text-primary-900 text-slate-700 transition-colors border border-slate-200/60"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleAsk} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask any question regarding obligations, terms, or covenants..."
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                disabled={isAsking || !selectedDocId}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <Button
                size="md"
                type="submit"
                isLoading={isAsking}
                disabled={!questionInput.trim() || !selectedDocId}
                className="shadow-xs gap-1.5"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Q&A Results Stream */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Answers & Retrieved Evidence ({qaHistory.length})
          </h2>

          {qaHistory.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white text-slate-500 text-xs">
              No questions asked yet in this session. Select an inquiry above to explore evidence-grounded answers.
            </div>
          ) : (
            qaHistory.map((item) => (
              <Card key={item.id} className="border-slate-200 bg-white shadow-xs">
                <CardHeader className="p-4 pb-2 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-primary-800" />
                    <h3 className="text-xs font-semibold text-slate-900">{item.question}</h3>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  {/* Answer */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Plain-Language Answer
                    </span>
                    <p className="text-slate-900 leading-relaxed font-medium">
                      {item.answer}
                    </p>
                  </div>

                  {/* Evidence Passage */}
                  {item.evidence && (
                    <div className="p-3 bg-amber-50/60 rounded-lg border-l-4 border-amber-500 text-slate-800">
                      <span className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                        Grounded Source Passage
                      </span>
                      <blockquote className="italic font-mono text-[11px] leading-relaxed">
                        &ldquo;{item.evidence}&rdquo;
                      </blockquote>
                    </div>
                  )}

                  {/* Source reference with direct link */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Source: {item.source.documentName} → Page {item.source.page} → {item.source.section}
                    </span>
                    <Link
                      href={`/documents/${item.documentId}`}
                      className="text-primary-800 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      View in Document Viewer <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DisclaimerBanner />
      </main>
    </div>
  );
}
