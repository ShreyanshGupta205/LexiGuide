"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  GitCompare,
  ArrowRight,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { DocumentComparisonResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading comparison interface...</div>}>
      <CompareContent />
    </React.Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const initialDocA = searchParams.get("docA") || "demo-doc-1";
  const initialDocB = searchParams.get("docB") || "demo-doc-2";

  const [availableDocs, setAvailableDocs] = React.useState<any[]>([]);
  const [docAId, setDocAId] = React.useState(initialDocA);
  const [docBId, setDocBId] = React.useState(initialDocB);
  const [isComparing, setIsComparing] = React.useState(false);
  const [comparisonResult, setComparisonResult] = React.useState<DocumentComparisonResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadDocs() {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
        setAvailableDocs(data.documents || []);

        // Trigger initial comparison if we have 2 docs
        if (initialDocA && initialDocB && initialDocA !== initialDocB) {
          runComparison(initialDocA, initialDocB);
        }
      } catch {
        // Ignore
      }
    }
    loadDocs();
  }, []);

  const runComparison = async (aId: string, bId: string) => {
    if (!aId || !bId || aId === bId) {
      setError("Please select two different documents to compare.");
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docAId: aId, docBId: bId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate comparison.");
      }

      const data = await res.json();
      setComparisonResult(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare documents.");
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex-1 flex">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Compare Documents
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Detect substantive differences, modified provisions, and added obligations between two contract versions.
          </p>
        </div>

        {/* Document Selection Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Select Contract Versions</CardTitle>
            <CardDescription className="text-xs">
              Choose Document A (Baseline / Prior version) and Document B (Updated / Counter-proposal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Document A (Baseline)
                </label>
                <select
                  value={docAId}
                  onChange={(e) => {
                    setDocAId(e.target.value);
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">Select Document A</option>
                  {availableDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fileName} ({doc.fileType.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Document B (Comparison Target)
                </label>
                <select
                  value={docBId}
                  onChange={(e) => {
                    setDocBId(e.target.value);
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">Select Document B</option>
                  {availableDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fileName} ({doc.fileType.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Comparing across 10 critical legal categories
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => runComparison(docAId, docBId)}
                isLoading={isComparing}
                disabled={!docAId || !docBId || docAId === docBId}
                className="shadow-xs"
              >
                <GitCompare className="w-4 h-4 mr-1.5" />
                Generate Comparison
              </Button>
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {comparisonResult && (
          <div className="space-y-8">
            {/* Overview Banner */}
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4 text-xs text-primary-950">
              <span className="font-bold block mb-1 text-primary-900">Comparison Overview:</span>
              <p className="leading-relaxed text-slate-700">{comparisonResult.overview}</p>
            </div>

            {/* Important Changes Section */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                Important Changes & Key Variations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisonResult.differences.map((diff) => (
                  <Card key={diff.id} className="border-slate-200 shadow-xs bg-white">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {diff.category}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            diff.impactLevel === "high"
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {diff.impactLevel.toUpperCase()} IMPACT
                        </span>
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-900 mt-1">
                        {diff.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-xs space-y-2">
                      <p className="text-slate-600 leading-relaxed">{diff.explanation}</p>
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                        {diff.docASource && (
                          <div>
                            <strong>Doc A:</strong> {diff.docASource.section} (Page {diff.docASource.page})
                          </div>
                        )}
                        {diff.docBSource && (
                          <div>
                            <strong>Doc B:</strong> {diff.docBSource.section} (Page {diff.docBSource.page})
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Side-by-Side Comparison Matrix */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                Comparative Clause Matrix
              </h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs" aria-label="Side by side comparison table">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th scope="col" className="p-3.5 pl-4 w-1/4">Category</th>
                        <th scope="col" className="p-3.5 w-1/3">
                          Document A: {comparisonResult.docAName}
                        </th>
                        <th scope="col" className="p-3.5 w-1/3">
                          Document B: {comparisonResult.docBName}
                        </th>
                        <th scope="col" className="p-3.5 pr-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {comparisonResult.matrix.map((row, idx) => {
                        const statusColors = {
                          added: "bg-emerald-50 text-emerald-800 border-emerald-200",
                          removed: "bg-rose-50 text-rose-800 border-rose-200",
                          modified: "bg-amber-50 text-amber-800 border-amber-200",
                          unchanged: "bg-slate-50 text-slate-600 border-slate-200",
                        };

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3.5 pl-4 font-semibold text-slate-900">
                              {row.category}
                            </td>
                            <td className="p-3.5 text-slate-700 leading-relaxed font-sans">
                              {row.docAValue}
                              {row.docASource && (
                                <span className="block text-[10px] text-slate-400 mt-1">
                                  {row.docASource.section} · P.{row.docASource.page}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-700 leading-relaxed font-sans">
                              {row.docBValue}
                              {row.docBSource && (
                                <span className="block text-[10px] text-slate-400 mt-1">
                                  {row.docBSource.section} · P.{row.docBSource.page}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 pr-4 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${
                                  statusColors[row.changeType]
                                }`}
                              >
                                {row.changeType}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <DisclaimerBanner />
          </div>
        )}
      </main>
    </div>
  );
}
