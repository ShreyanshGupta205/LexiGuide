"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Sparkles, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDemoLoading, setIsDemoLoading] = React.useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/documents", label: "Documents" },
    { href: "/compare", label: "Compare" },
    { href: "/questions", label: "Questions" },
    { href: "/consultation", label: "Consultation" },
  ];

  const handleTryDemo = async () => {
    try {
      setIsDemoLoading(true);
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (data.demoDocumentId) {
        router.push(`/documents/${data.demoDocumentId}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-slate-900 focus-visible:rounded-md"
            aria-label="LexiGuide Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-900 text-white shadow-xs">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight">LexiGuide</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Legal Intelligence</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-primary-900 bg-primary-50 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTryDemo}
            isLoading={isDemoLoading}
            className="border-slate-300 font-medium text-slate-700 hover:border-primary-400 hover:text-primary-900"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary-700 mr-1" aria-hidden="true" />
            Try Demo
          </Button>

          <Link href="/dashboard">
            <Button size="sm" variant="primary" className="gap-1.5 shadow-xs">
              <span>Open Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  pathname === link.href ? "bg-primary-50 text-primary-900 font-semibold" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                handleTryDemo();
              }}
              isLoading={isDemoLoading}
              className="w-full justify-center"
            >
              <Sparkles className="h-4 w-4 text-primary-700 mr-1.5" />
              Try Demo Agreement
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
