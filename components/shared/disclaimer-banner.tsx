import * as React from "react";
import { ShieldCheck, Info } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface DisclaimerBannerProps {
  compact?: boolean;
  className?: string;
}

export function DisclaimerBanner({ compact = false, className }: DisclaimerBannerProps) {
  if (compact) {
    return (
      <div
        role="note"
        aria-label="Legal information disclaimer"
        className={twMerge(
          clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/90 border border-slate-200 text-slate-600 text-xs",
            className
          )
        )}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-primary-700 shrink-0" aria-hidden="true" />
        <span>
          <strong>Informational Assistance:</strong> Not legal advice. Consult a licensed attorney for specific legal guidance.
        </span>
      </div>
    );
  }

  return (
    <aside
      role="note"
      aria-label="Platform legal advisory notice"
      className={twMerge(
        clsx(
          "rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-slate-700 shadow-sm",
          className
        )
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white p-2 border border-slate-200 text-primary-800 shadow-xs shrink-0">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-900">Legal Information & Assistance Notice</h4>
          <p className="text-xs leading-relaxed text-slate-600">
            LexiGuide provides automated document intelligence, section parsing, and plain-language summaries to assist
            your document review. <strong>LexiGuide is not a law firm, does not provide legal advice</strong>, and its outputs do not create an attorney-client relationship. Always verify critical terms with a qualified legal professional.
          </p>
        </div>
      </div>
    </aside>
  );
}
