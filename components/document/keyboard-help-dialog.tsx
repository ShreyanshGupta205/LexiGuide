"use client";

import * as React from "react";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyboardHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardHelpDialog({ isOpen, onClose }: KeyboardHelpDialogProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "/", description: "Focus in-document search box" },
    { key: "1 – 6", description: "Switch analysis tab (Clauses, Findings, Summary, Q&A, Fairness, Options)" },
    { key: "J", description: "Scroll down to next document section" },
    { key: "K", description: "Scroll up to previous document section" },
    { key: "Esc", description: "Close modal / clear search & highlighted clause" },
    { key: "?", description: "Toggle this keyboard shortcuts dialog" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900">
            <Keyboard className="w-5 h-5 text-primary-700" aria-hidden="true" />
            <h3 id="keyboard-shortcuts-title" className="text-sm font-bold">
              Keyboard Navigation Shortcuts
            </h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="h-7 w-7 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100"
            >
              <span className="text-slate-700 font-medium">{s.description}</span>
              <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-slate-800 shadow-2xs text-[11px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-500">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono">Esc</kbd> anytime to dismiss.
        </div>
      </div>
    </div>
  );
}
