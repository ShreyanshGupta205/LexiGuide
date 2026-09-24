"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  GitCompare,
  HelpCircle,
  Settings,
  MessageSquareQuote,
  Briefcase,
  BookOpen,
} from "lucide-react";
import { clsx } from "clsx";

export function Sidebar() {
  const pathname = usePathname();

  const mainLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/compare", label: "Compare", icon: GitCompare },
    { href: "/questions", label: "Questions", icon: MessageSquareQuote },
    { href: "/consultation", label: "Consultation", icon: Briefcase },
  ];

  const bottomLinks = [
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/help", label: "Help & FAQ", icon: HelpCircle },
  ];

  return (
    <aside
      className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 shrink-0"
      aria-label="Application Sidebar"
    >
      <div className="flex items-center gap-2.5 px-3 py-2 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900 text-white shadow-xs">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <span className="text-base font-bold text-slate-900 leading-none block">LexiGuide</span>
          <span className="text-[11px] text-slate-500 font-medium">Fine Print Intelligence</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1" aria-label="Main Navigation">
        {mainLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-900 font-semibold border-l-4 border-primary-800 rounded-l-none pl-2.5"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon className={clsx("h-4 w-4 shrink-0", isActive ? "text-primary-800" : "text-slate-500")} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-200 space-y-1">
        {bottomLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-900 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
