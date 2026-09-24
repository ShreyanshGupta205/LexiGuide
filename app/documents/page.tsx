"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  GitCompare,
  Briefcase,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { EmptyState } from "@/components/shared/empty-state";
import { FileUploader } from "@/components/upload/file-uploader";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" and all associated analysis data?`)) {
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

  const filteredDocs = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Documents
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Manage your uploaded agreements, analysis records, and citations.
            </p>
          </div>

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

        {/* Filter and Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search documents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              aria-label="Search documents"
            />
          </div>
          <span className="text-xs text-slate-500">
            {filteredDocs.length} {filteredDocs.length === 1 ? "document" : "documents"}
          </span>
        </div>

        {/* Document List */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchQuery ? "No matching documents" : "No documents yet"}
            description={
              searchQuery
                ? `No documents matched "${searchQuery}". Try a different search term.`
                : "Upload your first legal document or load the demo agreement to start understanding the fine print."
            }
            actionLabel="Upload Document"
            onAction={() => setShowUploadModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-primary-400 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-800 border border-primary-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-100 text-slate-600">
                      {doc.fileType}
                    </span>
                  </div>

                  <Link href={`/documents/${doc.id}`}>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-900 transition-colors line-clamp-1">
                      {doc.fileName}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {doc.summary?.documentType || "Legal Agreement"} · {doc.summary?.parties?.join(" & ") || "2 parties"}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      <strong>{doc.findingsCount}</strong> key findings
                    </span>
                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Link href={`/documents/${doc.id}`}>
                      <Button size="sm" variant="primary" className="h-8 text-xs px-3">
                        View Analysis
                      </Button>
                    </Link>
                    <Link href={`/documents/${doc.id}/consultation`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs px-2.5" title="Consultation Brief">
                        <Briefcase className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                    aria-label={`Delete ${doc.fileName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

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
