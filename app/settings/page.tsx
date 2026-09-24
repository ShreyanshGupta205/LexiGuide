"use client";

import * as React from "react";
import { ShieldCheck, Trash2, Key, Database, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";

export default function SettingsPage() {
  const [cleared, setCleared] = React.useState(false);

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to permanently clear all documents and analysis data?")) {
      return;
    }
    // Delete documents
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      for (const doc of data.documents || []) {
        await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      }
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="flex-1 flex">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Settings & Privacy
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage your document privacy, storage policies, and AI intelligence provider.
          </p>
        </div>

        {/* Privacy & Data Retention */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-800" />
              <CardTitle className="text-base font-semibold">Data Minimization & Storage</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Understand how your legal files are processed and retained.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-2">
              <h4 className="font-semibold text-slate-900">Our Privacy Principles:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong>Zero Logging:</strong> Document texts and confidential contractual terms are never recorded in server runtime logs.</li>
                <li><strong>Data Minimization:</strong> Chunks and extracted vectors are tied strictly to your user session ID.</li>
                <li><strong>Permanent Cascade Deletion:</strong> Deleting a document immediately purges raw text, section hierarchies, and AI findings.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Purge All Analysis Records</span>
                <span className="text-slate-500 text-[11px]">Permanently remove all documents and Q&A history.</span>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={handleClearAll}
                className="gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Documents</span>
              </Button>
            </div>

            {cleared && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All documents have been permanently removed.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Provider Configuration */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary-800" />
              <CardTitle className="text-base font-semibold">AI Intelligence Engine</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Current intelligence engine configuration and offline resilience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg border border-primary-100 bg-primary-50/50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary-950 block">Active Engine Mode: Local Deterministic AI</span>
                <span className="text-slate-600 text-[11px]">
                  LexiGuide operates in zero-dependency local mode with hybrid BM25 semantic retrieval. Fully functional offline.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ACTIVE & HEALTHY
              </span>
            </div>

            <p className="text-slate-500 leading-relaxed">
              To activate Gemini or OpenAI in production, set <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">GEMINI_API_KEY</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">OPENAI_API_KEY</code> in your environment variables.
            </p>
          </CardContent>
        </Card>

        <DisclaimerBanner />
      </main>
    </div>
  );
}
