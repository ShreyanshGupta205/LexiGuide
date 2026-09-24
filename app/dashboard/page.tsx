"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  GitCompare,
  MessageSquareQuote,
  Briefcase,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUploader } from "@/components/upload/file-uploader";
import { EmptyState } from "@/components/shared/empty-state";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showUploadModal, setShowUploadModal] = React.useState(false);

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this document and its analysis data?")) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      // Ignore
    }
  };

  const handleSeedDemo = async () => {
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (data.demoDocumentId) {
        router.push(`/documents/${data.demoDocumentId}`);
      } else {
        fetchDocs();
      }
    } catch {
      fetchDocs();
    }
  };

  return (
    <div className="flex-1 flex">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Good morning
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Understand your documents with clarity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemo}
              className="border-slate-300 bg-white text-slate-700 hover:border-primary-400 hover:text-primary-900"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary-700 mr-1.5" />
              Load Sample Contract
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Upload Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Upload a document</CardTitle>
            <CardDescription className="text-xs">
              Upload your agreement to extract structured clauses, attention alerts, and source citations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              onUploadSuccess={(docId) => {
                router.push(`/documents/${docId}`);
              }}
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              onClick={() => setShowUploadModal(true)}
              className="hover:border-primary-400 cursor-pointer transition-all hover:shadow-xs group"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-900">
                    Analyze Document
                  </h3>
                  <p className="text-[11px] text-slate-500">Extract clauses & obligations</p>
                </div>
              </CardContent>
            </Card>

            <Link href="/compare">
              <Card className="hover:border-primary-400 cursor-pointer transition-all hover:shadow-xs group h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <GitCompare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-900">
                      Compare Documents
                    </h3>
                    <p className="text-[11px] text-slate-500">Find differences across versions</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/questions">
              <Card className="hover:border-primary-400 cursor-pointer transition-all hover:shadow-xs group h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                    <MessageSquareQuote className="h-5 w-5 text-amber-800" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-900">
                      Ask a Question
                    </h3>
                    <p className="text-[11px] text-slate-500">Document-grounded answers</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/consultation">
              <Card className="hover:border-primary-400 cursor-pointer transition-all hover:shadow-xs group h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <Briefcase className="h-5 w-5 text-emerald-800" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-900">
                      Consultation Brief
                    </h3>
                    <p className="text-[11px] text-slate-500">Checklists & legal questions</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Documents</h2>
            <Link href="/documents" className="text-xs font-semibold text-primary-800 hover:text-primary-900 flex items-center gap-1">
              View all documents <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading documents...</div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload your first document or load a sample contract to start understanding the fine print."
              actionLabel="Upload Document"
              onAction={() => setShowUploadModal(true)}
              secondaryLabel="Load Sample Contract"
              onSecondaryAction={handleSeedDemo}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" aria-label="Recent documents list">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th scope="col" className="p-3.5 pl-4">Document Name</th>
                      <th scope="col" className="p-3.5">Type</th>
                      <th scope="col" className="p-3.5">Upload Date</th>
                      <th scope="col" className="p-3.5">Status</th>
                      <th scope="col" className="p-3.5">Findings</th>
                      <th scope="col" className="p-3.5 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.slice(0, 5).map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 pl-4 font-medium text-slate-900">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="flex items-center gap-2 hover:text-primary-900 hover:underline"
                          >
                            <FileText className="w-4 h-4 text-primary-700 shrink-0" />
                            <span className="truncate max-w-xs">{doc.fileName}</span>
                          </Link>
                        </td>
                        <td className="p-3.5 uppercase font-medium text-slate-500">
                          {doc.fileType}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Ready
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">
                          {doc.findingsCount} provisions
                        </td>
                        <td className="p-3.5 pr-4 text-right space-x-2">
                          <Link href={`/documents/${doc.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                              Open
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDelete(e, doc.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                            aria-label={`Delete ${doc.fileName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer Banner */}
        <DisclaimerBanner compact />

        {/* Upload Modal */}
        {showUploadModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 id="upload-modal-title" className="text-base font-semibold text-slate-900">
                  Upload Document
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              <FileUploader
                onUploadSuccess={(docId) => {
                  setShowUploadModal(false);
                  router.push(`/documents/${docId}`);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
