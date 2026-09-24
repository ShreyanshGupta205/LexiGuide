import * as React from "react";
import { AttentionLevel } from "@/lib/types";
import { Info, AlertTriangle, AlertOctagon } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface AttentionBadgeProps {
  level: AttentionLevel;
  className?: string;
  showIcon?: boolean;
  subtext?: string;
}

export function AttentionBadge({ level, className, showIcon = true, subtext }: AttentionBadgeProps) {
  let badgeConfig = {
    label: "INFORMATION",
    icon: Info,
    containerClass: "bg-blue-50 text-blue-900 border-blue-200",
    iconClass: "text-blue-700",
    ariaLabel: "Information level clause: standard document provision",
  };

  if (level === "IMPORTANT") {
    badgeConfig = {
      label: "IMPORTANT",
      icon: AlertTriangle,
      containerClass: "bg-amber-50 text-amber-950 border-amber-300 font-semibold",
      iconClass: "text-amber-700",
      ariaLabel: "Important level clause: requires careful understanding",
    };
  } else if (level === "NEEDS_ATTENTION") {
    badgeConfig = {
      label: "NEEDS ATTENTION",
      icon: AlertOctagon,
      containerClass: "bg-rose-50 text-rose-950 border-rose-300 font-semibold",
      iconClass: "text-rose-700",
      ariaLabel: "Needs attention clause: may warrant legal counsel review",
    };
  }

  const IconComponent = badgeConfig.icon;

  return (
    <div
      role="status"
      aria-label={badgeConfig.ariaLabel}
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border tracking-wide select-none",
          badgeConfig.containerClass,
          className
        )
      )}
    >
      {showIcon && <IconComponent className={twMerge("w-3.5 h-3.5 shrink-0", badgeConfig.iconClass)} aria-hidden="true" />}
      <span className="font-medium">{badgeConfig.label}</span>
      {subtext && <span className="text-slate-500 font-normal">· {subtext}</span>}
    </div>
  );
}
