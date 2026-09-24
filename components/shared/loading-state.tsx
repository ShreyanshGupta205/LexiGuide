import * as React from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface LoadingStep {
  id: string;
  label: string;
  status: "pending" | "current" | "completed";
}

interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  currentStepIndex?: number;
  className?: string;
}

const DEFAULT_STEPS: string[] = [
  "Extracting text from document",
  "Detecting legal sections & hierarchy",
  "Analyzing clauses & obligations",
  "Preparing plain-language insights & citations",
];

export function LoadingState({
  title = "Analyzing your legal document",
  subtitle = "Structuring clauses and cross-referencing provisions",
  currentStepIndex = 2,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-200 bg-white/90 shadow-sm max-w-md mx-auto text-center",
          className
        )
      )}
    >
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 border border-primary-100 text-primary-700">
        <Loader2 className="h-7 w-7 animate-spin text-primary-700" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-6">{subtitle}</p>

      <div className="w-full space-y-3 text-left">
        {DEFAULT_STEPS.map((stepLabel, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={clsx(
                "flex items-center gap-3 text-xs transition-colors duration-200 py-1 px-2 rounded-lg",
                isCurrent && "bg-primary-50/70 text-primary-950 font-medium",
                isCompleted && "text-slate-700",
                !isCompleted && !isCurrent && "text-slate-400"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-primary-700 animate-spin shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
              )}
              <span>{stepLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
