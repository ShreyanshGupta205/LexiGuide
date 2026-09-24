"use client";

import * as React from "react";
import Link from "next/link";
import { HelpCircle, ShieldCheck, ChevronDown, BookOpen, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { AttentionBadge } from "@/components/shared/attention-badge";

export default function HelpPage() {
  const faqs = [
    {
      q: "Does LexiGuide provide formal legal advice?",
      a: "No. LexiGuide is an automated informational intelligence tool designed to parse documents, surface important clauses, and summarize contract terms. It does not replace an attorney and should be used to prepare for discussions with licensed legal counsel.",
    },
    {
      q: "What do the Attention Levels signify?",
      a: "We classify provisions into three distinct levels: (1) INFORMATION for standard provisions; (2) IMPORTANT for clauses requiring careful comprehension such as payment or notice terms; and (3) NEEDS ATTENTION for provisions that may introduce significant risks or restrictive covenants like broad IP assignments or non-competes. We never label terms as definitively 'illegal' or 'invalid'.",
    },
    {
      q: "How does the evidence-first system work?",
      a: "Every finding, clause explanation, and Q&A answer links directly to the specific page and section of your original uploaded document. Clicking 'View Source' scrolls and highlights the exact contractual language in the split-screen viewer.",
    },
    {
      q: "What file formats are supported?",
      a: "You can upload PDF, DOCX (Word), or TXT documents up to 10MB in size. Password-protected files or scanned documents without text layers must be OCR'd prior to upload.",
    },
    {
      q: "How is prompt injection handled?",
      a: "Uploaded legal text is treated as strictly untrusted user data. Prompts isolate document passages inside secured XML boundaries with anti-jailbreak directives preventing embedded instructions from overriding platform safety guidelines.",
    },
  ];

  return (
    <div className="flex-1 flex">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Help & Knowledge Base
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Understanding LexiGuide principles, attention tiers, and document navigation.
          </p>
        </div>

        {/* Attention Level Guide */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">The LexiGuide Attention System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed">
              To avoid alarmist or unsubstantiated claims, provisions are categorized into three measured tiers:
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <AttentionBadge level="INFORMATION" />
                <span className="text-slate-700 leading-relaxed">
                  <strong>Information:</strong> Standard provisions describing routine operational terms, recitals, or boilerplate clauses.
                </span>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                <AttentionBadge level="IMPORTANT" />
                <span className="text-slate-800 leading-relaxed">
                  <strong>Important:</strong> Provisions that shape primary rights, milestone payment obligations, or notice requirements that warrant careful understanding.
                </span>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-rose-200 bg-rose-50/40">
                <AttentionBadge level="NEEDS_ATTENTION" />
                <span className="text-slate-900 leading-relaxed">
                  <strong>Needs Attention:</strong> Provisions that warrant professional discussion with an attorney, such as post-employment restrictions, unilateral indemnities, or broad IP captures.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frequently Asked Questions */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((item, idx) => (
              <Card key={idx} className="border-slate-200 shadow-xs">
                <CardHeader className="p-4 pb-1">
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    {item.q}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-slate-600 leading-relaxed">
                  {item.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DisclaimerBanner />
      </main>
    </div>
  );
}
