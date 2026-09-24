import * as React from "react";
import { FileText, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white/60",
          className
        )
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mb-4 shadow-xs">
        <Icon className="h-7 w-7 text-slate-600" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="md" variant="primary">
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} size="md" variant="outline">
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
