"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ExternalLink,
  MessageSquareQuote,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Calendar,
  Users,
  Clock,
  Sparkles,
  HelpCircle,
  Briefcase,
  ChevronDown,
  Filter,
  Scale,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttentionBadge } from "@/components/shared/attention-badge";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { KeyboardHelpDialog } from "@/components/document/keyboard-help-dialog";
import { RedlineViewer } from "@/components/document/redline-viewer";
import { LegalDocument, ClauseAnalysis, KeyFinding, ClauseCategory, AdvancedIntelligenceReport } from "@/lib/types";

export interface QAHistoryItem {
  id: string;
  documentId: string;
  question: string;
  answer: string;
  evidence: string;
  source: { documentName: string; page: number; section: string; chunkId?: string };
  confidence: "high" | "moderate" | "unsupported";
  timestamp: string;
}

export default function DocumentAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [currentDoc, setCurrentDoc] = React.useState<LegalDocument | null>(null);
  const [allDocs, setAllDocs] = React.useState<Array<{ id: string; fileName: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Active view tab for right panel: "clauses" | "findings" | "summary" | "qa" | "fairness"
  const [activeAnalysisTab, setActiveAnalysisTab] = React.useState<"clauses" | "findings" | "summary" | "qa" | "fairness">("clauses");
  
  // Mobile responsive view toggle: "doc" | "analysis"
  const [mobileTab, setMobileTab] = React.useState<"doc" | "analysis">("analysis");

  // Category filter for clauses / findings
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  // Left document search
  const [docSearchQuery, setDocSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Highlighted target section ID in left panel
  const [highlightedSectionId, setHighlightedSectionId] = React.useState<string | null>(null);

  // Q&A state
  const [questionInput, setQuestionInput] = React.useState("");
  const [isAsking, setIsAsking] = React.useState(false);
  const [qaHistory, setQaHistory] = React.useState<QAHistoryItem[]>([]);

  // Advanced Intelligence (Symmetry & Missing Protections)
  const [intelligenceReport, setIntelligenceReport] = React.useState<AdvancedIntelligenceReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = React.useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = React.useState<string | null>(null);

  // Accessibility: Keyboard Shortcuts modal
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);

  // Fetch document details and list of available documents
  React.useEffect(() => {
    async function loadDoc() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/documents/${docId}`);
        if (!res.ok) {
          throw new Error("Document not found or access denied.");
        }
        const data = await res.json();
        setCurrentDoc(data.document);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load document.");
      } finally {
        setIsLoading(false);
      }
    }

    async function loadAllDocs() {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
        setAllDocs(data.documents || []);
      } catch {
        // Non-blocking
      }
    }

    if (docId) {
      loadDoc();
      loadAllDocs();
    }
  }, [docId]);

  // View Source action: Scrolls to and highlights target section in left panel
  const handleViewSource = React.useCallback((sectionTitle: string, _pageNumber: number) => {
    // If on mobile, switch to the document tab first
    setMobileTab("doc");

    // Match section by title or section number
    const sec = currentDoc?.sections.find(
      (s) => s.title.toLowerCase() === sectionTitle.toLowerCase() || sectionTitle.toLowerCase().includes(s.title.toLowerCase())
    ) || currentDoc?.sections[0];

    if (sec) {
      setHighlightedSectionId(sec.id);
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const el = window.document.getElementById(`section-${sec.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 100);
    }
  }, [currentDoc]);

  // Load Advanced Intelligence (Symmetry & Missing Protections)
  const loadAdvancedIntelligence = React.useCallback(async () => {
    if (!currentDoc || isLoadingReport) return;
    setIsLoadingReport(true);
    try {
      const res = await fetch("/api/advanced-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: currentDoc.id }),
      });
      const data = await res.json();
      if (data.report) {
        setIntelligenceReport(data.report);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingReport(false);
    }
  }, [currentDoc, isLoadingReport]);

  // Accessibility: Global keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "Escape") {
        setIsHelpOpen(false);
        setHighlightedSectionId(null);
        if (isInput) (target as HTMLInputElement).blur();
        return;
      }

      if (isInput) return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      } else if (e.key === "1") {
        setActiveAnalysisTab("clauses");
      } else if (e.key === "2") {
        setActiveAnalysisTab("findings");
      } else if (e.key === "3") {
        setActiveAnalysisTab("summary");
      } else if (e.key === "4") {
        setActiveAnalysisTab("qa");
      } else if (e.key === "5") {
        setActiveAnalysisTab("fairness");
        if (!intelligenceReport) loadAdvancedIntelligence();
      } else if (e.key.toLowerCase() === "j") {
        // Step to next section
        if (currentDoc && currentDoc.sections.length > 0) {
          const currentIndex = currentDoc.sections.findIndex((s) => s.id === highlightedSectionId);
          const nextIndex = currentIndex < currentDoc.sections.length - 1 ? currentIndex + 1 : 0;
          const nextSec = currentDoc.sections[nextIndex];
          handleViewSource(nextSec.title, nextSec.page);
        }
      } else if (e.key.toLowerCase() === "k") {
        // Step to previous section
        if (currentDoc && currentDoc.sections.length > 0) {
          const currentIndex = currentDoc.sections.findIndex((s) => s.id === highlightedSectionId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentDoc.sections.length - 1;
          const prevSec = currentDoc.sections[prevIndex];
          handleViewSource(prevSec.title, prevSec.page);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDoc, highlightedSectionId, intelligenceReport, handleViewSource, loadAdvancedIntelligence]);

  const handleCopySnippet = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippetId(id);
      setTimeout(() => setCopiedSnippetId(null), 2000);
    }
  };

  // Ask Question submit handler
  const handleAskQuestion = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = (customQ || questionInput).trim();
    if (!query || isAsking || !currentDoc) return;

    setIsAsking(true);
    setQuestionInput("");

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: currentDoc.id,
          question: query,
        }),
      });

      const data = await res.json();
      if (data.interaction) {
        setQaHistory((prev) => [data.interaction, ...prev]);
        setActiveAnalysisTab("qa");
      }
    } catch {
      // Ignore
    } finally {
      setIsAsking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-800 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading document intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !currentDoc) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Document Unavailable</h2>
          <p className="text-xs text-slate-600">{error || "Could not retrieve the requested document."}</p>
          <Link href="/dashboard">
            <Button size="sm" variant="primary">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const FINDING_CATEGORIES: { key: ClauseCategory; label: string }[] = [
    { key: "obligations", label: "Obligations" },
    { key: "payments", label: "Payments" },
    { key: "termination", label: "Termination" },
    { key: "confidentiality", label: "Confidentiality" },
    { key: "intellectual_property", label: "Intellectual Property" },
    { key: "liability", label: "Liability" },
    { key: "renewal", label: "Renewal" },
    { key: "dispute_resolution", label: "Dispute Resolution" },
    { key: "governing_law", label: "Governing Law" },
  ];

  const filteredClauses = (currentDoc.clauses || []).filter((clause) => {
    if (selectedCategory === "all") return true;
    return clause.clauseType.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top Breadcrumb & Document Actions Toolbar */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/documents">
            <Button size="sm" variant="ghost" className="h-8 px-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back to Docs</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-primary-800 shrink-0" />
            {allDocs.length > 1 ? (
              <select
                value={currentDoc.id}
                onChange={(e) => router.push(`/documents/${e.target.value}`)}
                aria-label="Switch active document"
                className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-0 hover:bg-slate-100 rounded px-1.5 py-1 cursor-pointer max-w-[200px] sm:max-w-xs truncate focus:outline-none focus:ring-1 focus:ring-primary-600"
              >
                {allDocs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fileName}
                  </option>
                ))}
              </select>
            ) : (
              <h1 className="text-sm font-bold text-slate-900 truncate">
                {currentDoc.fileName}
              </h1>
            )}
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
              {currentDoc.fileType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile switcher */}
          <div className="flex md:hidden rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setMobileTab("doc")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                mobileTab === "doc" ? "bg-white text-primary-900 shadow-xs" : "text-slate-600"
              }`}
            >
              Document
            </button>
            <button
              onClick={() => setMobileTab("analysis")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                mobileTab === "analysis" ? "bg-white text-primary-900 shadow-xs" : "text-slate-600"
              }`}
            >
              Analysis
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsHelpOpen(true)}
            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 gap-1.5 border border-slate-200"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5 text-primary-700" />
            <span className="hidden sm:inline">Shortcuts</span>
            <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-slate-100 text-[10px] font-mono border">?</kbd>
          </Button>

          <Link href={`/documents/${currentDoc.id}/consultation`}>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-slate-300">
              <Briefcase className="w-3.5 h-3.5 text-primary-800" />
              <span className="hidden sm:inline">Consultation Brief</span>
            </Button>
          </Link>

          <Link href={`/compare?docA=${currentDoc.id}`}>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-slate-300">
              <span className="hidden sm:inline">Compare with Doc</span>
              <span className="sm:hidden">Compare</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================
            LEFT PANE: ORIGINAL DOCUMENT (SPLIT SCREEN LEFT)
           ======================================================== */}
        <section
          aria-label="Original Legal Document Text"
          className={`flex-1 md:w-1/2 flex flex-col border-r border-slate-200 bg-slate-50/50 overflow-hidden ${
            mobileTab === "analysis" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Document Header & Search Toolbar */}
          <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Original Document
              </span>
              <span className="text-[11px] text-slate-500">
                ({currentDoc.sections.length} sections detected)
              </span>
            </div>

            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Find in document... (/)"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-600 font-sans"
                aria-label="Search within original document text"
              />
              <kbd className="absolute right-2 top-1.5 px-1 py-0.2 rounded bg-slate-200/60 text-[10px] font-mono text-slate-500 hidden sm:inline select-none">/</kbd>
            </div>
          </div>

          {/* Document Text Body with Anchors */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs leading-relaxed text-slate-800 bg-white">
            {currentDoc.sections
              .filter((sec) =>
                !docSearchQuery
                  ? true
                  : sec.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
                    sec.content.toLowerCase().includes(docSearchQuery.toLowerCase())
              )
              .map((section) => {
                const isTarget = highlightedSectionId === section.id;

                return (
                  <article
                    key={section.id}
                    id={`section-${section.id}`}
                    tabIndex={0}
                    className={`rounded-lg p-4 transition-all duration-300 ${
                      isTarget
                        ? "legal-clause-target bg-blue-50 border-l-4 border-primary-600 shadow-sm"
                        : "border border-slate-100 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                      <span className="font-bold text-slate-900 text-xs tracking-tight">
                        {section.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans font-medium px-2 py-0.5 rounded bg-slate-100">
                        Page {section.page}
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap text-slate-700 font-sans text-xs leading-normal">
                      {section.content}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        {/* ========================================================
            RIGHT PANE: AI ANALYSIS (SPLIT SCREEN RIGHT)
           ======================================================== */}
        <section
          aria-label="AI Document Intelligence and Clause Breakdown"
          className={`flex-1 md:w-1/2 flex flex-col bg-slate-50/30 overflow-hidden ${
            mobileTab === "doc" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Analysis Tab Bar */}
          <div className="border-b border-slate-200 bg-white px-4 pt-2 shrink-0 flex items-center justify-between">
            <div className="flex gap-1" role="tablist" aria-label="Analysis Tabs">
              <button
                id="tab-clauses"
                role="tab"
                aria-selected={activeAnalysisTab === "clauses"}
                aria-controls="panel-clauses"
                onClick={() => setActiveAnalysisTab("clauses")}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeAnalysisTab === "clauses"
                    ? "border-primary-800 text-primary-950 bg-primary-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Clauses ({currentDoc.clauses?.length || 0})
              </button>
              <button
                id="tab-findings"
                role="tab"
                aria-selected={activeAnalysisTab === "findings"}
                aria-controls="panel-findings"
                onClick={() => setActiveAnalysisTab("findings")}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeAnalysisTab === "findings"
                    ? "border-primary-800 text-primary-950 bg-primary-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Key Findings ({currentDoc.findings?.length || 0})
              </button>
              <button
                id="tab-summary"
                role="tab"
                aria-selected={activeAnalysisTab === "summary"}
                aria-controls="panel-summary"
                onClick={() => setActiveAnalysisTab("summary")}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeAnalysisTab === "summary"
                    ? "border-primary-800 text-primary-950 bg-primary-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Document Summary
              </button>
              <button
                id="tab-qa"
                role="tab"
                aria-selected={activeAnalysisTab === "qa"}
                aria-controls="panel-qa"
                onClick={() => setActiveAnalysisTab("qa")}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeAnalysisTab === "qa"
                    ? "border-primary-800 text-primary-950 bg-primary-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-primary-700" />
                <span>Q&A</span>
                {qaHistory.length > 0 && (
                  <span className="h-4 w-4 rounded-full bg-primary-900 text-white text-[10px] flex items-center justify-center font-bold">
                    {qaHistory.length}
                  </span>
                )}
              </button>
              <button
                id="tab-fairness"
                role="tab"
                aria-selected={activeAnalysisTab === "fairness"}
                aria-controls="panel-fairness"
                onClick={() => {
                  setActiveAnalysisTab("fairness");
                  if (!intelligenceReport) {
                    loadAdvancedIntelligence();
                  }
                }}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeAnalysisTab === "fairness"
                    ? "border-primary-800 text-primary-950 bg-primary-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-primary-700" />
                <span>Fairness & Missing Terms</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Unique AI
                </span>
              </button>
            </div>
          </div>

          {/* Analysis Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* ========================================================
                TAB 1: STRUCTURED CLAUSES
               ======================================================== */}
            {activeAnalysisTab === "clauses" && (
              <div
                role="tabpanel"
                id="panel-clauses"
                aria-labelledby="tab-clauses"
                tabIndex={0}
                className="space-y-4 focus:outline-none"
              >
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === "all"
                        ? "bg-primary-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    All Clauses ({currentDoc.clauses?.length || 0})
                  </button>
                  {FINDING_CATEGORIES.map((cat) => {
                    const count = (currentDoc.clauses || []).filter(
                      (c) => c.clauseType.toLowerCase() === cat.key.toLowerCase()
                    ).length;
                    if (count === 0) return null;

                    return (
                      <button
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === cat.key
                            ? "bg-primary-900 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {cat.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {filteredClauses.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                    No clauses identified in this category for the analyzed document.
                  </div>
                ) : (
                  filteredClauses.map((clause) => (
                    <Card
                      key={clause.id}
                      className="border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {clause.clauseType.replace("_", " ")}
                            </span>
                            <CardTitle className="text-sm font-semibold text-slate-900 mt-0.5">
                              {clause.title}
                            </CardTitle>
                          </div>
                          <AttentionBadge level={clause.attentionLevel} />
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-2 space-y-3 text-xs">
                        {/* Plain language explanation */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Plain-Language Explanation
                          </span>
                          <p className="text-slate-800 leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                            {clause.explanation}
                          </p>
                        </div>

                        {/* Applies to & Obligations */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg border border-slate-100 p-2.5 bg-white">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                              Applies To
                            </span>
                            <span className="text-slate-800 font-medium">{clause.appliesTo}</span>
                          </div>

                          <div className="rounded-lg border border-slate-100 p-2.5 bg-white">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                              Key Obligations
                            </span>
                            <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                              {clause.obligations.slice(0, 2).map((ob, i) => (
                                <li key={i} className="truncate">{ob}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Potential Questions for Lawyer */}
                        {clause.potentialQuestions && clause.potentialQuestions.length > 0 && (
                          <div className="rounded-lg border border-primary-100 bg-primary-50/40 p-2.5 text-xs">
                            <span className="text-[10px] font-bold uppercase text-primary-900 flex items-center gap-1 mb-1">
                              <HelpCircle className="w-3 h-3 text-primary-700" />
                              Questions to Ask Legal Counsel
                            </span>
                            <p className="text-slate-700 italic">
                              &ldquo;{clause.potentialQuestions[0]}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Source citation with "View Source" button */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                          <span className="text-[11px] font-medium text-slate-600">
                            Source: {clause.source.section} · Page {clause.source.page}
                          </span>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleViewSource(clause.source.section, clause.source.page)}
                            className="h-7 text-xs px-2.5 font-semibold text-primary-900 bg-primary-50 hover:bg-primary-100"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Source
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* ========================================================
                TAB 2: KEY FINDINGS BY CATEGORY (Section 12)
               ======================================================== */}
            {activeAnalysisTab === "findings" && (
              <div
                role="tabpanel"
                id="panel-findings"
                aria-labelledby="tab-findings"
                tabIndex={0}
                className="space-y-4 focus:outline-none"
              >
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  Key provisions extracted across 10 standard legal categories. Categories not present in this document are explicitly marked.
                </div>

                <div className="space-y-3">
                  {FINDING_CATEGORIES.map((cat) => {
                    const matchedFindings = (currentDoc.findings || []).filter(
                      (f) => f.category === cat.key
                    );

                    const hasFindings = matchedFindings.length > 0;

                    return (
                      <div
                        key={cat.key}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            {cat.label}
                          </h3>
                          {hasFindings ? (
                            <AttentionBadge level={matchedFindings[0].attentionLevel} />
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 italic">
                              Not identified in the analyzed document.
                            </span>
                          )}
                        </div>

                        {hasFindings ? (
                          <div className="space-y-2 mt-2">
                            {matchedFindings.map((finding) => (
                              <div key={finding.id} className="text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                                <h4 className="font-semibold text-slate-900 mb-1">{finding.title}</h4>
                                <p className="text-slate-700 leading-relaxed mb-2">{finding.content}</p>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                                  <span>{finding.source.section} · Page {finding.source.page}</span>
                                  <button
                                    onClick={() => handleViewSource(finding.source.section, finding.source.page)}
                                    className="text-primary-800 font-semibold hover:underline"
                                  >
                                    View in document →
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic mt-1">
                            No explicit {cat.label.toLowerCase()} clauses or covenants detected.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================
                TAB 3: DOCUMENT SUMMARY (Section 12)
               ======================================================== */}
            {activeAnalysisTab === "summary" && (
              <div
                role="tabpanel"
                id="panel-summary"
                aria-labelledby="tab-summary"
                tabIndex={0}
                className="space-y-4 focus:outline-none"
              >
                <Card className="border-slate-200 bg-white shadow-xs">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold">Executive Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1">
                          <FileText className="w-3 h-3" /> Document Type
                        </span>
                        <span className="text-slate-900 font-semibold">
                          {currentDoc.summary?.documentType || "Legal Agreement"}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1">
                          <Users className="w-3 h-3" /> Parties Involved
                        </span>
                        <span className="text-slate-900 font-semibold">
                          {currentDoc.summary?.parties.join(" & ") || "Parties identified in agreement"}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" /> Effective Date
                        </span>
                        <span className="text-slate-900 font-semibold">
                          {currentDoc.summary?.effectiveDate || "Effective upon execution"}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" /> Duration & Term
                        </span>
                        <span className="text-slate-900 font-semibold">
                          {currentDoc.summary?.duration || "Standard term until terminated"}
                        </span>
                      </div>
                    </div>

                    {/* Major Obligations */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Major Obligations
                      </h4>
                      <ul className="space-y-1.5">
                        {(currentDoc.summary?.majorObligations || []).map((ob, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary-800 shrink-0 mt-0.5" />
                            <span>{ob}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Major Sections */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Document Structure
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(currentDoc.summary?.majorSections || []).map((sec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <DisclaimerBanner compact />
              </div>
            )}

            {/* ========================================================
                TAB 4: GROUNDED DOCUMENT Q&A (Section 15)
               ======================================================== */}
            {activeAnalysisTab === "qa" && (
              <div
                role="tabpanel"
                id="panel-qa"
                aria-labelledby="tab-qa"
                tabIndex={0}
                className="space-y-4 focus:outline-none"
              >
                {/* Header */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Ask about this document</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Grounds answers directly in retrieved document passages with full source citations.
                    </p>
                  </div>

                  {/* Common Suggested Questions */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Suggested Questions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "What are the termination conditions?",
                        "Who is responsible for payment?",
                        "How long does this agreement last?",
                        "What are my main obligations?",
                        "Is there an intellectual property assignment?",
                      ].map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleAskQuestion(undefined, sug)}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-primary-50 hover:text-primary-900 text-slate-700 transition-colors text-left border border-slate-200/60"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ask Question Form */}
                  <form onSubmit={handleAskQuestion} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Type a question about this agreement..."
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      disabled={isAsking}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    <Button size="sm" type="submit" isLoading={isAsking} disabled={!questionInput.trim()}>
                      Ask
                    </Button>
                  </form>
                </div>

                {/* Q&A Conversation History */}
                {qaHistory.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                    Select a suggested question above or type your own question to see grounded answers and evidence.
                  </div>
                ) : (
                  qaHistory.map((item) => (
                    <Card key={item.id} className="border-slate-200 bg-white shadow-xs">
                      <CardHeader className="p-4 pb-2 bg-slate-50/50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <MessageSquareQuote className="w-4 h-4 text-primary-800" />
                          <h4 className="text-xs font-semibold text-slate-900">
                            {item.question}
                          </h4>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-xs">
                        {/* Plain Answer */}
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Answer
                          </span>
                          <p className="text-slate-900 leading-relaxed font-medium">
                            {item.answer}
                          </p>
                        </div>

                        {/* Evidence passage */}
                        {item.evidence && (
                          <div className="p-3 bg-amber-50/50 rounded-lg border-l-4 border-amber-500 text-slate-800">
                            <span className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                              Evidence Passage
                            </span>
                            <blockquote className="italic font-mono text-[11px] leading-relaxed">
                              &ldquo;{item.evidence}&rdquo;
                            </blockquote>
                          </div>
                        )}

                        {/* Source */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            Source: {item.source.documentName} → Page {item.source.page} → {item.source.section}
                          </span>
                          <button
                            onClick={() => handleViewSource(item.source.section, item.source.page)}
                            className="text-primary-800 font-semibold hover:underline"
                          >
                            View Source →
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* ========================================================
                TAB 5: CONTRACT FAIRNESS, MISSING PROTECTIONS & COUNTER-PROPOSALS
               ======================================================== */}
            {activeAnalysisTab === "fairness" && (
              <div
                role="tabpanel"
                id="panel-fairness"
                aria-labelledby="tab-fairness"
                tabIndex={0}
                className="space-y-6 focus:outline-none"
              >
                {/* Intro Hero Card */}
                <div className="rounded-xl border border-primary-100 bg-gradient-to-r from-primary-900 to-primary-950 p-5 text-white shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-400 text-slate-950 mb-2">
                        <Sparkles className="w-3 h-3" />
                        Proprietary Intelligence
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Contract Symmetry & Negative Space Radar
                      </h3>
                      <p className="text-xs text-primary-200 mt-1 max-w-xl leading-relaxed">
                        Evaluates unilateral power balances, identifies dangerous protective terms that were omitted from this draft, and provides calibrated counter-language for negotiations.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAdvancedIntelligence}
                      disabled={isLoadingReport}
                      className="shrink-0 bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
                    >
                      {isLoadingReport ? "Analyzing..." : "Re-scan Terms"}
                    </Button>
                  </div>
                </div>

                {isLoadingReport && !intelligenceReport && (
                  <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-900 border-t-transparent rounded-full mb-3" />
                    <p className="text-xs font-semibold text-slate-800">
                      Scanning contract symmetry and negative space omissions...
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Evaluating bilateral risk allocation, IP exclusions, and missing standard remedies.
                    </p>
                  </div>
                )}

                {intelligenceReport && (
                  <>
                    {/* SECTION 1: POWER BALANCE & SYMMETRY METER */}
                    <Card className="border-slate-200 bg-white shadow-xs">
                      <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-primary-800" />
                            <CardTitle className="text-sm font-bold text-slate-900">
                              Contract Power Balance & Symmetry Score
                            </CardTitle>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            0 = Fully Unilateral | 100 = Fully Reciprocal
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 space-y-5">
                        {/* Overall Gauge Banner */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-white shrink-0 shadow-sm ${
                                intelligenceReport.symmetry.overallScore >= 80
                                  ? "bg-emerald-600"
                                  : intelligenceReport.symmetry.overallScore >= 60
                                  ? "bg-amber-600"
                                  : "bg-rose-600"
                              }`}
                            >
                              <span className="text-2xl leading-none">
                                {intelligenceReport.symmetry.overallScore}
                              </span>
                              <span className="text-[10px] font-normal uppercase opacity-90">
                                / 100
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Balance Assessment
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                                {intelligenceReport.symmetry.assessment}
                              </h4>
                              <p className="text-xs text-slate-600 mt-1">
                                {intelligenceReport.symmetry.overallScore < 70
                                  ? "This document exhibits structural imbalances where burdens fall disproportionately on one party while protections favor the other."
                                  : "This agreement features a reasonable level of reciprocal obligations and bilateral protections."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Dimensional Breakdown Progress Bars */}
                        <div className="space-y-3 pt-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Key Dimension Parity Breakdown
                          </h5>
                          <div className="grid grid-cols-1 gap-3">
                            {intelligenceReport.symmetry.dimensions.map((dim, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-900">
                                    {dim.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        dim.status === "balanced"
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                          : dim.status === "unilateral"
                                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                                          : "bg-amber-100 text-amber-800 border border-amber-200"
                                      }`}
                                    >
                                      {dim.status.replace("_", " ")}
                                    </span>
                                    <span className="font-mono font-bold text-slate-700">
                                      {dim.score}%
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      dim.score >= 80
                                        ? "bg-emerald-600"
                                        : dim.score >= 60
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{ width: `${dim.score}%` }}
                                  />
                                </div>
                                <p className="text-[11px] text-slate-600 leading-normal">
                                  {dim.note}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SECTION 2: NEGATIVE SPACE SCANNER (MISSING PROTECTIONS) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            <h4 className="text-sm font-bold text-slate-900">
                              Negative Space Scanner — Missing Standard Protections
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Standard protective clauses that are absent from this draft, exposing you to avoidable legal exposure.
                          </p>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          {intelligenceReport.missingProtections.length} Gaps Detected
                        </span>
                      </div>

                      <div className="space-y-3">
                        {intelligenceReport.missingProtections.map((gap) => (
                          <Card
                            key={gap.id}
                            className="border-slate-200 bg-white shadow-xs overflow-hidden"
                          >
                            <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                    {gap.category}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      gap.riskSeverity === "high"
                                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                                        : "bg-amber-100 text-amber-800 border border-amber-200"
                                    }`}
                                  >
                                    {gap.riskSeverity === "high" ? "High Risk Gap" : "Moderate Risk Gap"}
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-900 mt-1">
                                  {gap.title}
                                </h5>
                              </div>
                            </div>

                            <CardContent className="p-4 space-y-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                  The Legal Risk
                                </span>
                                <p className="text-slate-700 leading-relaxed">
                                  {gap.description}
                                </p>
                              </div>

                              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-blue-950">
                                <span className="text-[10px] font-bold uppercase text-blue-800 block mb-1">
                                  Recommended Remedy
                                </span>
                                <p className="leading-relaxed">
                                  {gap.recommendedRemedy}
                                </p>
                              </div>

                              {gap.sampleCounterLanguage && (
                                <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                                    <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Suggested Protective Clause to Insert:
                                    </span>
                                    <button
                                      onClick={() => handleCopySnippet(gap.id, gap.sampleCounterLanguage!)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px] transition-colors"
                                    >
                                      {copiedSnippetId === gap.id ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy Clause</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <blockquote className="font-mono text-[11px] text-slate-200 leading-relaxed italic border-l-2 border-amber-400 pl-3">
                                    &ldquo;{gap.sampleCounterLanguage}&rdquo;
                                  </blockquote>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: STRATEGIC COUNTER-PROPOSAL ENGINE */}
                    {intelligenceReport.counterProposals.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <h4 className="text-sm font-bold text-slate-900">
                              Negotiation Counter-Proposals & Talking Points
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Calibrated counter-proposals to push back against one-sided terms without alienating the other party.
                          </p>
                        </div>

                        <div className="space-y-4">
                          {intelligenceReport.counterProposals.map((cp) => (
                            <Card
                              key={cp.clauseId}
                              className="border-slate-200 bg-white shadow-xs overflow-hidden"
                            >
                              <CardHeader className="p-4 pb-2 bg-amber-50/30 border-b border-amber-100">
                                <span className="text-[10px] font-bold uppercase text-amber-900">
                                  Target Clause
                                </span>
                                <h5 className="text-xs font-bold text-slate-900">
                                  {cp.clauseTitle}
                                </h5>
                                <p className="text-[11px] text-slate-600">
                                  {cp.originalTextSummary}
                                </p>
                              </CardHeader>
                              <CardContent className="p-4 space-y-3 text-xs">
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                                    Strategic Objective
                                  </span>
                                  <p className="font-semibold text-slate-900">
                                    {cp.negotiationObjective}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">
                                      Interactive Redline Diff
                                    </span>
                                    <button
                                      onClick={() => handleCopySnippet(cp.clauseId, cp.suggestedWording)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px] transition-colors"
                                    >
                                      {copiedSnippetId === cp.clauseId ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy Proposal</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <RedlineViewer
                                    originalText={cp.originalTextSummary}
                                    revisedText={cp.suggestedWording}
                                  />
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                    Tactical Talking Points (Why this is standard & fair)
                                  </span>
                                  <ul className="space-y-1.5">
                                    {cp.talkingPoints.map((tp, tpIdx) => (
                                      <li
                                        key={tpIdx}
                                        className="flex items-start gap-2 text-slate-700 text-[11px] leading-relaxed"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{tp}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legal Disclaimer */}
                    <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                      <p>
                        <strong>Disclaimer:</strong> Contract symmetry scoring, missing protection detection, and counter-proposals are automated informational aids to facilitate discussion. They do not constitute legal advice or formal attorney representation. Always review proposed edits with a qualified legal professional.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Accessible Keyboard Shortcut Reference Dialog */}
      <KeyboardHelpDialog
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
