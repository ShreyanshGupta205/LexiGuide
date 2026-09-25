"use client";

import * as React from "react";
import { Mail, Copy, Check, ExternalLink, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CounterProposalItem {
  clauseTitle: string;
  suggestedWording: string;
  talkingPoints: string[];
}

interface NegotiationEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  counterProposals: CounterProposalItem[];
}

export function NegotiationEmailModal({
  isOpen,
  onClose,
  documentName,
  counterProposals,
}: NegotiationEmailModalProps) {
  const [recipientName, setRecipientName] = React.useState("the legal / drafting team");
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const subject = `Proposed Adjustments & Clarifications - ${documentName}`;

  const emailBody = `Dear ${recipientName},

Thank you for providing the draft agreement for ${documentName}. We have completed an initial review of the terms and are excited to move forward.

In the interest of ensuring reciprocal protections and alignment with standard market practices, we would like to propose a few minor adjustments for your consideration:

${counterProposals.map((cp, idx) => `${idx + 1}. Regarding ${cp.clauseTitle}:
   • Proposed Revision: "${cp.suggestedWording}"
   • Rationale: ${cp.talkingPoints.join("; ")}
`).join("\n")}
We believe these modest adjustments reflect balanced terms for both parties and will allow us to execute the agreement expeditiously.

Please let us know if these adjustments are acceptable or if you would like to discuss them briefly.

Best regards,
[Your Name / Title]
[Your Organization]`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(emailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="negotiation-email-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-700" />
            <div>
              <h3 id="negotiation-email-title" className="text-sm font-bold text-slate-900">
                AI Negotiation Email Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Pre-formatted, respectful email template embedding your proposed redlines and talking points.
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close Email Generator"
            className="h-7 w-7 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Recipient Customization */}
        <div className="flex items-center gap-2 text-xs shrink-0 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-700 whitespace-nowrap">Recipient:</span>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. John Smith, HR Team, Landlord"
            className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary-600"
          />
        </div>

        {/* Email Preview */}
        <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs font-mono">
          <div className="text-[11px] text-slate-500 border-b border-slate-200 pb-1">
            <strong>Subject:</strong> {subject}
          </div>
          <pre className="whitespace-pre-wrap text-slate-800 font-mono text-[11px] leading-relaxed">
            {emailBody}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Calibrated for professional diplomacy
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="text-xs flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </Button>

            <a href={mailtoUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="primary" className="text-xs flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Open in Email App</span>
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
