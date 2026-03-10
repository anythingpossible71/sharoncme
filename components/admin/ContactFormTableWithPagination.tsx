"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  MessageSquare,
  Phone,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  importContactSubmissionsAction,
  type ContactSubmissionImportRow,
} from "@/app/actions/contact-submissions";

interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  activityType: string;
  birthdate?: Date | null;
  babyBirthdate?: Date | null;
  message?: string | null;
  howFound?: string | null;
  referrerName?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string | null;
}

/** Escape a CSV field: quote if contains comma, newline, or quote; double internal quotes */
function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value).trim();
  const needsQuotes = /[,"\n\r]/.test(s);
  if (!needsQuotes) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

function exportSubmissionsToCsv(submissions: ContactSubmission[]) {
  const headers = [
    "Name",
    "Phone",
    "Email",
    "Activity Type",
    "Birth Date",
    "Baby Birth Date",
    "Message",
    "How Found",
    "Referrer",
    "Submitted At",
  ];
  const rows = submissions.map((s) => [
    escapeCsvField(s.name),
    escapeCsvField(s.phone),
    escapeCsvField(s.email ?? null),
    escapeCsvField(s.activityType),
    s.birthdate ? escapeCsvField(new Date(s.birthdate).toISOString()) : "",
    s.babyBirthdate ? escapeCsvField(new Date(s.babyBirthdate).toISOString()) : "",
    escapeCsvField(s.message ?? null),
    escapeCsvField(s.howFound ?? null),
    escapeCsvField(s.referrerName ?? null),
    escapeCsvField(new Date(s.created_at).toISOString()),
  ]);
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const EXPORT_HEADERS = [
  "Name",
  "Phone",
  "Email",
  "Activity Type",
  "Birth Date",
  "Baby Birth Date",
  "Message",
  "How Found",
  "Referrer",
  "Submitted At",
];

/** Parse a single CSV line handling quoted fields */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      current += c;
    } else if (c === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvToImportRows(csvText: string): ContactSubmissionImportRow[] {
  const text = csvText.replace(/^\uFEFF/, ""); // Strip BOM
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);
  const expected = EXPORT_HEADERS.join(",");
  const actual = headers.join(",");
  if (actual !== expected) {
    throw new Error(`Invalid CSV format. Expected headers: ${expected}. Got: ${actual}`);
  }

  const rows: ContactSubmissionImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length >= 10) {
      rows.push({
        name: values[0] || "",
        phone: values[1] || "",
        email: values[2] || null,
        activityType: values[3] || "",
        birthdate: values[4] || null,
        babyBirthdate: values[5] || null,
        message: values[6] || null,
        howFound: values[7] || null,
        referrerName: values[8] || null,
        submittedAt: values[9] || null,
      });
    }
  }
  return rows;
}

interface ContactFormTableWithPaginationProps {
  submissions: ContactSubmission[];
}

export function ContactFormTableWithPagination({
  submissions,
}: ContactFormTableWithPaginationProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<
    | { phase: "idle" }
    | { phase: "reading"; detail?: string }
    | { phase: "parsing"; detail?: string; rowCount?: number }
    | {
        phase: "uploading";
        detail?: string;
        rowCount?: number;
        batchIndex?: number;
        totalBatches?: number;
      }
    | {
        phase: "processing";
        detail?: string;
        rowCount?: number;
        batchIndex?: number;
        totalBatches?: number;
      }
  >({ phase: "idle" });
  const itemsPerPage = 110;

  /** Turn generic network errors into actionable messages */
  function normalizeImportError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();
    if (
      lower.includes("failed to fetch") ||
      lower.includes("network request failed") ||
      lower.includes("load failed")
    ) {
      return "Connection lost before the response arrived. The import may have completed—refresh the page to check. If contacts appear, the import succeeded.";
    }
    if (lower.includes("timeout") || lower.includes("timed out")) {
      return "Request timed out. The import may have completed—refresh the page to check. If not, try again with a smaller CSV.";
    }
    return msg || "Import failed";
  }

  const handleImportClick = () => {
    setImportStatus(null);
    setImportStep({ phase: "idle" });
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);
    setImportStep({ phase: "reading", detail: file.name });

    try {
      const text = await file.text();
      setImportStep({ phase: "parsing", detail: "Validating format", rowCount: undefined });

      const rows = parseCsvToImportRows(text);
      if (rows.length === 0) {
        setImportStep({ phase: "idle" });
        setImportStatus({ type: "error", message: "No valid rows found in CSV" });
        setIsImporting(false);
        return;
      }

      const BATCH_SIZE = 75;
      const batches = Array.from({ length: Math.ceil(rows.length / BATCH_SIZE) }, (_, i) =>
        rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
      );
      const totalBatches = batches.length;

      let totalImported = 0;
      let totalSkipped = 0;
      let batchError: string | null = null;

      for (let i = 0; i < batches.length; i++) {
        setImportStep({
          phase: "uploading",
          detail: `Batch ${i + 1} of ${totalBatches}`,
          rowCount: rows.length,
          batchIndex: i + 1,
          totalBatches,
        });

        try {
          const result = await importContactSubmissionsAction(batches[i]);
          if (result.success) {
            totalImported += result.imported;
            totalSkipped += result.skipped;
          } else {
            batchError = result.error || "Import failed";
            break;
          }
        } catch (err) {
          batchError = normalizeImportError(err);
          break;
        }
      }

      setImportStep({ phase: "idle" });

      if (batchError) {
        setImportStatus({
          type: totalImported > 0 ? "success" : "error",
          message:
            totalImported > 0
              ? `Imported ${totalImported} before error. ${batchError}`
              : normalizeImportError(new Error(batchError)),
        });
      } else {
        setImportStatus({
          type: "success",
          message: `Imported ${totalImported} contact${totalImported !== 1 ? "s" : ""}${totalSkipped > 0 ? `, skipped ${totalSkipped}` : ""}`,
        });
      }
      router.refresh();
    } catch (err) {
      setImportStep({ phase: "idle" });
      const isParse = err instanceof Error && err.message.includes("Invalid CSV format");
      setImportStatus({
        type: "error",
        message: isParse ? err.message : normalizeImportError(err),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const totalPages = Math.ceil(submissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = submissions.slice(startIndex, endIndex);

  const handleRowClick = (submissionId: string) => {
    const submission = submissions.find((s) => s.id === submissionId);
    if (submission) {
      setSelectedSubmission(submission);
    }
  };

  const handleBackToList = () => {
    setSelectedSubmission(null);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Show submission details if one is selected
  if (selectedSubmission) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        </div>

        {/* Submission details */}
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Submission Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Name
                </label>
                <p className="text-lg font-medium mt-1">{selectedSubmission.name}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Phone
                </label>
                <div className="mt-1 space-y-2">
                  <p className="text-lg font-medium">{selectedSubmission.phone}</p>
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <a href={`tel:${selectedSubmission.phone}`}>📞 Call</a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://wa.me/${selectedSubmission.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        💬 WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Email
                </label>
                <p className="text-lg mt-1">{selectedSubmission.email || "Not provided"}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Activity Type
                </label>
                <p className="mt-1">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {selectedSubmission.activityType}
                  </span>
                </p>
              </div>
            </div>

            {/* Dates and Additional Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Submission Date
                </label>
                <p className="text-lg mt-1">
                  {format(new Date(selectedSubmission.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {selectedSubmission.birthdate && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Birth Date
                  </label>
                  <p className="text-lg mt-1">
                    {format(new Date(selectedSubmission.birthdate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}

              {selectedSubmission.babyBirthdate && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Baby Birth Date
                  </label>
                  <p className="text-lg mt-1">
                    {format(new Date(selectedSubmission.babyBirthdate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}

              {selectedSubmission.howFound && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    How They Found You
                  </label>
                  <p className="text-lg mt-1">{selectedSubmission.howFound}</p>
                </div>
              )}

              {selectedSubmission.referrerName && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Referrer Name
                  </label>
                  <p className="text-lg mt-1">{selectedSubmission.referrerName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {selectedSubmission.message && (
            <div className="border-t pt-6">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Message
              </label>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedSubmission.message}
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t pt-6">
            <div className="flex gap-3">
              {selectedSubmission.email && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${selectedSubmission.email}`}>
                    📧 Email {selectedSubmission.email}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no submissions
  if (submissions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isImporting ? "Importing..." : "Import contacts"}
          </Button>
        </div>
        {isImporting && importStep.phase !== "idle" && (
          <div className=" rounded-lg border border-muted bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Import in progress
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li
                className={`flex items-center gap-2 ${importStep.phase === "reading" ? "text-foreground font-medium" : ""}`}
              >
                {importStep.phase === "reading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                )}
                Reading file
                {importStep.phase === "reading" && importStep.detail
                  ? `: ${importStep.detail}`
                  : ""}
              </li>
              <li
                className={`flex items-center gap-2 ${importStep.phase === "parsing" ? "text-foreground font-medium" : ""}`}
              >
                {importStep.phase === "parsing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                )}
                Parsing CSV
                {importStep.phase === "parsing" && importStep.detail
                  ? ` — ${importStep.detail}`
                  : ""}
              </li>
              <li
                className={`flex items-center gap-2 ${importStep.phase === "uploading" || importStep.phase === "processing" ? "text-foreground font-medium" : ""}`}
              >
                {importStep.phase === "uploading" || importStep.phase === "processing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <Database className="h-3.5 w-3.5 shrink-0" />
                )}
                Sending to server
                {"batchIndex" in importStep &&
                importStep.batchIndex != null &&
                "totalBatches" in importStep &&
                importStep.totalBatches != null
                  ? ` — batch ${importStep.batchIndex} of ${importStep.totalBatches}`
                  : "rowCount" in importStep && importStep.rowCount
                    ? ` (${importStep.rowCount} rows)`
                    : ""}
              </li>
            </ol>
          </div>
        )}
        {importStatus && (
          <div
            className={`p-3 rounded text-sm flex items-start gap-2 ${
              importStatus.type === "success"
                ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
            }`}
          >
            {importStatus.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            {importStatus.message}
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No contact form submissions yet</p>
          <p className="text-sm">
            Import a CSV file (same format as export) or wait for form submissions
          </p>
        </div>
      </div>
    );
  }

  // Show table with pagination
  return (
    <div className="space-y-4">
      {/* Toolbar: Export & Import */}
      <div className="flex items-center justify-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          disabled={isImporting}
          className="flex items-center gap-2"
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isImporting ? "Importing..." : "Import contacts"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportSubmissionsToCsv(submissions)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export contacts
        </Button>
      </div>
      {isImporting && importStep.phase !== "idle" && (
        <div className="rounded-lg border border-muted bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Import in progress
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li
              className={`flex items-center gap-2 ${importStep.phase === "reading" ? "text-foreground font-medium" : ""}`}
            >
              {importStep.phase === "reading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" />
              )}
              Reading file
              {importStep.phase === "reading" && importStep.detail ? `: ${importStep.detail}` : ""}
            </li>
            <li
              className={`flex items-center gap-2 ${importStep.phase === "parsing" ? "text-foreground font-medium" : ""}`}
            >
              {importStep.phase === "parsing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" />
              )}
              Parsing CSV
              {importStep.phase === "parsing" && importStep.detail ? ` — ${importStep.detail}` : ""}
            </li>
            <li
              className={`flex items-center gap-2 ${importStep.phase === "uploading" || importStep.phase === "processing" ? "text-foreground font-medium" : ""}`}
            >
              {importStep.phase === "uploading" || importStep.phase === "processing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <Database className="h-3.5 w-3.5 shrink-0" />
              )}
              Sending to server
              {"batchIndex" in importStep &&
              importStep.batchIndex != null &&
              "totalBatches" in importStep &&
              importStep.totalBatches != null
                ? ` — batch ${importStep.batchIndex} of ${importStep.totalBatches}`
                : "rowCount" in importStep && importStep.rowCount
                  ? ` (${importStep.rowCount} rows)`
                  : ""}
            </li>
          </ol>
        </div>
      )}
      {importStatus && (
        <div
          className={`p-3 rounded text-sm flex items-start gap-2 ${
            importStatus.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {importStatus.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          {importStatus.message}
        </div>
      )}
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold">Date</th>
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Phone</th>
              <th className="text-left p-3 font-semibold">Activity</th>
              <th className="text-left p-3 font-semibold">Message</th>
              <th className="text-left p-3 font-semibold">How Found</th>
              <th className="text-left p-3 font-semibold">Referrer</th>
            </tr>
          </thead>
          <tbody>
            {currentSubmissions.map((submission) => (
              <tr
                key={submission.id}
                className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(submission.id)}
              >
                <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(submission.created_at), "MMM d, yyyy")}
                </td>
                <td className="p-3 font-medium">{submission.name}</td>
                <td className="p-3">
                  <a
                    href={`tel:${submission.phone}`}
                    className="hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {submission.phone}
                  </a>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {submission.activityType}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">
                  {submission.message || "-"}
                </td>
                <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">
                  {submission.howFound ? String(submission.howFound) : "-"}
                </td>
                <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">
                  {submission.referrerName ? String(submission.referrerName) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, submissions.length)} of{" "}
            {submissions.length} submissions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
