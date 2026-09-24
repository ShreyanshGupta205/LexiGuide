"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";

export default function ConsultationIndexPage() {
  const router = useRouter();
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDocs() {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    }
    loadDocs();
  }, []);

  return (
    <div className="flex-1 flex">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Prepare for Legal Consultation
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Generate tailored question lists, document checklists, and key provision summaries before meeting with counsel.
          </p>
        </div>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Select a Document to Prepare</CardTitle>
            <CardDescription className="text-xs">
              Choose an agreement to synthesize critical provisions and actionable preparation checklists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No documents found. Please upload a document or load a demo contract first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary-800" />
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {doc.fileName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {doc.summary?.documentType || "Agreement"} · {doc.findingsCount} findings identified
                      </p>
                    </div>

                    <Link href={`/documents/${doc.id}/consultation`}>
                      <Button size="sm" variant="primary" className="w-full text-xs justify-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                        Generate Consultation Brief
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <DisclaimerBanner />
      </main>
    </div>
  );
}
