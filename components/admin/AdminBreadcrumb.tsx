"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useIframeMode } from "@/hooks/use-iframe-mode";

interface AdminBreadcrumbProps {
  sectionName: string;
  sectionHref?: string;
  subsectionName?: string;
  subsectionHref?: string;
  leftActionButtons?: React.ReactNode;
  actionButtons?: React.ReactNode;
}

export function AdminBreadcrumb({
  sectionName,
  sectionHref,
  subsectionName,
  subsectionHref,
  leftActionButtons,
  actionButtons,
}: AdminBreadcrumbProps) {
  const isIframeMode = useIframeMode();

  return (
    <div className="flex items-center justify-between mb-6 min-h-[40px]">
      {/* Breadcrumbs and left action buttons */}
      <div className="flex items-center gap-3">
        <nav className="flex items-center space-x-2 text-lg">
          {!isIframeMode && (
            <>
              <Link
                href="/admin/getting-started"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          {subsectionName ? (
            <>
              {sectionHref ? (
                <Link
                  href={sectionHref}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {sectionName}
                </Link>
              ) : (
                <span className="text-muted-foreground">{sectionName}</span>
              )}
              <span className="text-muted-foreground"> / </span>
              {subsectionHref ? (
                <Link
                  href={subsectionHref}
                  className="font-bold text-foreground hover:text-foreground/80 transition-colors"
                >
                  {subsectionName}
                </Link>
              ) : (
                <span className="font-bold text-foreground">{subsectionName}</span>
              )}
            </>
          ) : sectionHref ? (
            <Link
              href={sectionHref}
              className="font-medium text-foreground hover:text-foreground/80 transition-colors"
            >
              {sectionName}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{sectionName}</span>
          )}
        </nav>
        {/* Left Action Buttons - right after breadcrumb */}
        {leftActionButtons && <div className="flex items-center">{leftActionButtons}</div>}
      </div>

      {/* Action Buttons - floated to the right */}
      {actionButtons && <div className="flex items-center gap-2">{actionButtons}</div>}
    </div>
  );
}
