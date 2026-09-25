"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Search,
  GitCompare,
  FileCheck,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttentionBadge } from "@/components/shared/attention-badge";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";

export default function LandingPage() {
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = React.useState(false);

  const handleTryDemo = async () => {
    try {
      setIsDemoLoading(true);
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (data.demoDocumentId) {
        router.push(`/documents/${data.demoDocumentId}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Top Advisory Pill */}
      <section className="bg-primary-50 border-b border-primary-100 py-2.5 px-4 text-center">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs font-medium text-primary-950">
          <ShieldCheck className="h-4 w-4 text-primary-700" aria-hidden="true" />
          <span>Evidence-First Legal Document Intelligence Platform</span>
          <span className="text-primary-300">|</span>
          <span className="text-slate-600 hidden sm:inline">Understand the fine print before you sign or consult.</span>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 mb-6 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>Ready for PDF, DOCX, and TXT agreements</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Understand the fine print.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered document intelligence that helps you understand, compare, and navigate legal documents.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-md">
                <span>Upload Document</span>
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
              </Button>
            </Link>

            <Button
              size="lg"
              variant="outline"
              onClick={handleTryDemo}
              isLoading={isDemoLoading}
              className="w-full sm:w-auto border-slate-300 bg-white text-slate-800 hover:border-primary-400 hover:text-primary-900"
            >
              <Sparkles className="h-4 w-4 text-primary-700 mr-1.5" aria-hidden="true" />
              Try Demo Agreement
            </Button>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Instant evaluation with preloaded sample contract · No credit card or registration required
          </p>
        </div>

        {/* Visual Product Preview */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-12">
          <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-900/5 p-2 sm:p-3 shadow-xl ring-1 ring-slate-900/10">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Fake Window Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-300" />
                  <div className="h-3 w-3 rounded-full bg-slate-300" />
                  <div className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="ml-2 text-xs font-medium text-slate-600">
                    Acme_Innovations_Employment_Agreement_2025.pdf
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-primary-900 bg-primary-100 px-2.5 py-0.5 rounded">
                    Split-Screen Evidence Mode
                  </span>
                </div>
              </div>

              {/* Split Screen Mockup */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* Left: Original Document */}
                <div className="p-6 bg-slate-50/40 text-left font-mono text-xs text-slate-700 space-y-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Original Document (Page 3)
                  </div>
                  <div className="text-slate-500 line-through select-none text-[11px]">
                    SECTION 4.1 Termination for Cause...
                  </div>
                  <div className="legal-clause-highlight border-l-4 border-amber-500 bg-amber-50/90 p-3 rounded-r-md">
                    <p className="font-semibold text-slate-900 mb-1">
                      SECTION 4.2 Termination Without Cause or Resignation
                    </p>
                    <p className="text-slate-800 text-[11px] leading-relaxed">
                      &ldquo;Either party may terminate this Agreement without cause at any time upon providing thirty (30) days&apos; prior written notice to the other party...&rdquo;
                    </p>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    SECTION 4.3 Severance. If the Company terminates Executive&apos;s employment without Cause, the Executive shall receive...
                  </p>
                </div>

                {/* Right: AI Analysis */}
                <div className="p-6 bg-white text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      AI Clause Analysis
                    </div>
                    <AttentionBadge level="IMPORTANT" subtext="Requires Review" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Termination Notice Requirement
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Either party can terminate the agreement by providing 30 days&apos; written notice. Outlines cause and without-cause provisions.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Applies To</span>
                      <span className="text-slate-800 font-medium">Both Parties</span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Notice Period</span>
                      <span className="text-slate-800 font-medium">30 Days Written</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Source: Page 3 · Section 4.2</span>
                    <span className="font-semibold text-primary-800 flex items-center gap-1">
                      Source Linked <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Built for precision, not guesswork
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              LexiGuide provides four core capabilities to help you navigate contractual documents with complete confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Understand */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center mb-4">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Understand</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Turn complex legal language into clear explanations. Extract key parties, durations, obligations, and terms without the dense jargon.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-primary-800 flex items-center gap-1">
                  Plain-language translation <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* 2. Compare */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100 flex items-center justify-center mb-4">
                  <GitCompare className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Compare</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Find meaningful differences between two documents. Surface changes across 10 critical categories including payment, termination, and liability.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-primary-800 flex items-center gap-1">
                  Side-by-side matrix <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* 3. Identify */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center mb-4">
                  <Search className="h-5 w-5 text-amber-800" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Identify</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Surface important clauses, obligations, and areas that deserve attention. Categorize provisions by Attention Level with direct citations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-primary-800 flex items-center gap-1">
                  Attention triage system <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* 4. Prepare */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-center mb-4">
                  <Briefcase className="h-5 w-5 text-emerald-800" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Prepare</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate useful questions and checklists for conversations with legal professionals. Walk into consultations prepared and organized.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-primary-800 flex items-center gap-1">
                  Consultation briefs <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              How it works
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              A structured, evidence-first journey from raw legal text to actionable clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-3xl font-extrabold text-slate-300 block mb-2">01</span>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Upload</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your legal document in PDF, DOCX, or TXT format with client-side verification and size guards.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-3xl font-extrabold text-slate-300 block mb-2">02</span>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Analyze</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                LexiGuide extracts text, detects legal sections, and chunks content with full page and clause metadata.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-3xl font-extrabold text-slate-300 block mb-2">03</span>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Understand</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore structured clauses, findings, and plain-language explanations with split-screen source citations.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-3xl font-extrabold text-slate-300 block mb-2">04</span>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Prepare</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate high-value questions, compare contract drafts, and export a structured consultation brief.
              </p>
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="mt-16 max-w-4xl mx-auto">
            <DisclaimerBanner />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-900 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to understand your document?
          </h2>
          <p className="mt-3 text-primary-200 text-sm sm:text-base max-w-xl mx-auto">
            Start analyzing contracts, employment agreements, NDAs, and leases with clear source evidence today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary-950 hover:bg-slate-100 font-semibold shadow-md">
                Upload a Document
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={handleTryDemo}
              isLoading={isDemoLoading}
              className="w-full sm:w-auto border-primary-700 bg-transparent text-white hover:bg-primary-800"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Explore Sample Agreement
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
