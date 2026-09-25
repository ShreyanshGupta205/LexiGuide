"use client";

import * as React from "react";
import { Calendar, Clock, Download, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineEvent {
  id: string;
  title: string;
  timeframe: string;
  category: "notice" | "renewal" | "covenant" | "execution";
  description: string;
  actionRequired: string;
}

interface DeadlinesTimelineProps {
  documentName: string;
  effectiveDate?: string;
  duration?: string;
  className?: string;
}

export function DeadlinesTimeline({
  documentName,
  effectiveDate = "Effective upon signing",
  duration = "Standard commercial term",
  className,
}: DeadlinesTimelineProps) {
  const events: TimelineEvent[] = [
    {
      id: "ev-1",
      title: "Contract Execution & Inception",
      timeframe: "Day 0 (Effective Date)",
      category: "execution",
      description: `Agreement becomes legally active (${effectiveDate}). Intellectual Property assignment covenants take effect immediately.`,
      actionRequired: "File countersigned PDF and archive in corporate records.",
    },
    {
      id: "ev-2",
      title: "Breach Notice & Cure Grace Period",
      timeframe: "30-Day Window (Upon Notice)",
      category: "notice",
      description: "Standard 30-day window following written notice to rectify any operational or performance breaches before termination.",
      actionRequired: "Respond in writing within 5 business days if notice of breach is received.",
    },
    {
      id: "ev-3",
      title: "Notice of Non-Renewal / Termination Window",
      timeframe: "60 Days Prior to Expiration",
      category: "renewal",
      description: "Required lead time to provide written notice if choosing not to renew the agreement for another term.",
      actionRequired: "Set calendar reminder 75 days before term expiration to review renewal terms.",
    },
    {
      id: "ev-4",
      title: "Post-Termination Restrictive Covenants",
      timeframe: "Months 1 – 12 / 24 Post-Departure",
      category: "covenant",
      description: "Non-solicitation and confidential information protection covenants continue after contract termination.",
      actionRequired: "Adhere strictly to non-solicitation boundaries until covenant duration expires.",
    },
  ];

  // Generates and downloads standard .ics calendar file
  const handleDownloadCalendar = () => {
    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const sanitizeIcs = (str: string) => str.replace(/[,;]/g, " ");

    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//LexiGuide//Legal Deadlines//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n`;

    events.forEach((ev, i) => {
      // Create offset dates (e.g. 30 days, 60 days, 365 days from today)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + (i === 1 ? 30 : i === 2 ? 300 : 365));
      const dateStr = targetDate.toISOString().replace(/[-:]/g, "").split(".")[0].slice(0, 8);

      icsContent += `BEGIN:VEVENT\r\nUID:lexiguide-${ev.id}-${Date.now()}@lexiguide.app\r\nDTSTAMP:${now}\r\nDTSTART;VALUE=DATE:${dateStr}\r\nSUMMARY:${sanitizeIcs(ev.title)} - ${sanitizeIcs(documentName)}\r\nDESCRIPTION:${sanitizeIcs(ev.description)} Action: ${sanitizeIcs(ev.actionRequired)}\r\nSTATUS:CONFIRMED\r\nEND:VEVENT\r\n`;
    });

    icsContent += `END:VCALENDAR\r\n`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${documentName.replace(/[^a-zA-Z0-9_-]/g, "_")}_deadlines.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={`border-slate-200 bg-white shadow-xs ${className || ""}`}>
      <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-800" />
          <CardTitle className="text-sm font-bold text-slate-900">
            Critical Deadlines & Obligations Timeline
          </CardTitle>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadCalendar}
          className="text-xs flex items-center gap-1.5 border-slate-300 hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5 text-primary-700" />
          <span>Export to Calendar (.ics)</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-xs">
        <div className="relative pl-6 border-l-2 border-primary-200 space-y-5 my-2">
          {events.map((ev) => (
            <div key={ev.id} className="relative group">
              {/* Timeline Bullet Node */}
              <div
                className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                  ev.category === "execution"
                    ? "bg-primary-900"
                    : ev.category === "notice"
                    ? "bg-amber-500"
                    : ev.category === "renewal"
                    ? "bg-emerald-600"
                    : "bg-indigo-600"
                }`}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-xs">{ev.title}</h4>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {ev.timeframe}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{ev.description}</p>
                <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Required Action:</strong> {ev.actionRequired}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
