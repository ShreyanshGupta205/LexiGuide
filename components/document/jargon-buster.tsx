"use client";

import * as React from "react";
import { BookOpen, Search, X, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JargonEntry {
  term: string;
  category: "Liability" | "Termination" | "Remedies" | "General";
  plainEnglish: string;
  realWorldRisk: string;
  example: string;
}

const LEGAL_GLOSSARY: JargonEntry[] = [
  {
    term: "Indemnification",
    category: "Liability",
    plainEnglish: "A promise to pay for the other party's legal fees and financial losses if a lawsuit or claim occurs.",
    realWorldRisk: "If unilateral, you could be forced to pay thousands in attorney fees even if you were only minimally at fault.",
    example: "'Executive agrees to indemnify Company against any third-party claims arising from software developed.'",
  },
  {
    term: "Joint and Several Liability",
    category: "Liability",
    plainEnglish: "All parties are collectively responsible for a debt or harm, but the plaintiff can collect the full 100% amount from any single individual.",
    realWorldRisk: "If your co-signer or partner cannot pay, you are on the hook for the entire sum alone.",
    example: "'The signatories shall be jointly and severally liable for all payment obligations hereunder.'",
  },
  {
    term: "Force Majeure",
    category: "General",
    plainEnglish: "An 'Act of God' clause excusing parties from contractual obligations due to unforeseen catastrophic events (wars, natural disasters, epidemics).",
    realWorldRisk: "If worded too narrowly, normal business disruptions or supply chain halts are not excused.",
    example: "'Neither party shall be liable for delays caused by floods, riots, or governmental actions beyond control.'",
  },
  {
    term: "Liquidated Damages",
    category: "Remedies",
    plainEnglish: "A pre-agreed, fixed monetary penalty that must be paid automatically if a specific breach occurs, without having to prove actual damages in court.",
    realWorldRisk: "Can be punitive if set disproportionately high relative to actual harm.",
    example: "'Breach of confidentiality triggers $50,000 in liquidated damages per occurrence.'",
  },
  {
    term: "Severability",
    category: "General",
    plainEnglish: "If a judge invalidates one clause in the agreement, the rest of the contract remains legally valid and binding.",
    realWorldRisk: "Standard protective boilerplate; ensures the entire contract doesn't collapse over a minor unenforceable term.",
    example: "'If any provision is held invalid, the remaining provisions shall remain in full force.'",
  },
  {
    term: "Subrogation",
    category: "Liability",
    plainEnglish: "When an insurance company pays your claim, they 'step into your shoes' to sue the responsible third party to recover their money.",
    realWorldRisk: "Waiver of subrogation clauses prevent your insurer from suing the other contracting party.",
    example: "'Each party waives all rights of subrogation against the other for insured property damages.'",
  },
  {
    term: "In Perpetuity",
    category: "Termination",
    plainEnglish: "Forever; without any expiration date or termination period.",
    realWorldRisk: "Dangerous when applied to non-disclosure or IP licenses; you may remain bound for decades after leaving.",
    example: "'The license granted herein is non-exclusive, irrevocable, and in perpetuity.'",
  },
  {
    term: "Cure Period",
    category: "Termination",
    plainEnglish: "A grace period (typically 15 to 30 days) after written notice during which a party can fix an alleged breach before the contract is terminated.",
    realWorldRisk: "Absence of a cure period allows immediate termination for cause without warning.",
    example: "'The breaching party shall have thirty (30) days following notice to cure such breach.'",
  },
];

interface JargonBusterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JargonBusterModal({ isOpen, onClose }: JargonBusterModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  if (!isOpen) return null;

  const filtered = LEGAL_GLOSSARY.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.plainEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.realWorldRisk.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="jargon-buster-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-700" />
            <div>
              <h3 id="jargon-buster-title" className="text-sm font-bold text-slate-900">
                Interactive Legal Jargon Buster
              </h3>
              <p className="text-[11px] text-slate-500">
                Plain-English explanations and risk breakdowns for complex legal terms.
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close Jargon Buster"
            className="h-7 w-7 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search legal term (e.g. Indemnification, Cure, Perpetuity)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
            {["all", "Liability", "Termination", "Remedies", "General"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? "All Terms" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Glossary Terms List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching legal terms found. Try a different search query.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-primary-800 font-mono">§</span>
                    {item.term}
                  </h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {item.plainEnglish}
                </p>

                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Why It Matters to You:</strong> {item.realWorldRisk}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded border border-slate-200/70 italic">
                  Example in contracts: {item.example}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-500 shrink-0">
          Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono">Esc</kbd> anytime to dismiss.
        </div>
      </div>
    </div>
  );
}
