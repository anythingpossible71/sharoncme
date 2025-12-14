"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MessageSquare, Phone, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

interface ContactFormTableWithPaginationProps {
  submissions: ContactSubmission[];
}

export function ContactFormTableWithPagination({
  submissions,
}: ContactFormTableWithPaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const itemsPerPage = 110;

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
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No contact form submissions yet</p>
        <p className="text-sm">
          Submissions will appear here once users start filling out your contact form
        </p>
      </div>
    );
  }

  // Show table with pagination
  return (
    <div className="space-y-4">
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
