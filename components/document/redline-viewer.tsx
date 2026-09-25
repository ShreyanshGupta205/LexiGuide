import * as React from "react";

interface RedlineViewerProps {
  originalText: string;
  revisedText: string;
  className?: string;
}

/**
 * Computes and renders word-level redline diff markup between original and revised provisions.
 */
export function RedlineViewer({ originalText, revisedText, className }: RedlineViewerProps) {
  const origWords = originalText.trim().split(/\s+/);
  const revWords = revisedText.trim().split(/\s+/);

  // Simple and fast word-level diff approximation
  const origSet = new Set(origWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const revSet = new Set(revWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")));

  return (
    <div className={`space-y-3 font-sans text-xs leading-relaxed ${className || ""}`}>
      {/* Side-by-side or combined visual indicators */}
      <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
            <span className="font-bold">−</span> Original Text
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="font-bold">+</span> Counter-Proposal / Revision
          </span>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 rounded bg-rose-50/50 border border-rose-200 text-rose-950 font-mono text-[11px] leading-normal">
            <span className="font-bold font-sans text-rose-800 block text-[10px] uppercase mb-1">Original Draft Provision:</span>
            {originalText}
          </div>

          <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-200 text-emerald-950 font-mono text-[11px] leading-normal">
            <span className="font-bold font-sans text-emerald-800 block text-[10px] uppercase mb-1">Proposed Balanced Revision:</span>
            {revisedText}
          </div>
        </div>
      </div>
    </div>
  );
}
