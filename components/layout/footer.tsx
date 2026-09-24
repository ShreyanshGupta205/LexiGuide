import * as React from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-8 text-slate-500 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-900 text-white">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span className="font-semibold text-slate-800">LexiGuide</span>
            <span className="text-slate-400">·</span>
            <span>Understand the fine print.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/help" className="hover:text-slate-800 transition-colors">
              Help & FAQ
            </Link>
            <Link href="/settings" className="hover:text-slate-800 transition-colors">
              Privacy & Data
            </Link>
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-700" aria-hidden="true" />
              Not Legal Advice
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-slate-400">
          <p>© {new Date().getFullYear()} LexiGuide. Built for informational document intelligence and analysis.</p>
        </div>
      </div>
    </footer>
  );
}
