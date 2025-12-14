"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { getTemplatePages } from "@/app/actions/template-pages";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

interface AppPage {
  id: string;
  title: string;
  path: string;
  dev_instructions: string;
  preview_image: string | null;
  requires_login: boolean;
}

export const dynamic = "force-dynamic";

export default function PagesResultPage() {
  const searchParams = useSearchParams();
  const initialSearchValue = searchParams.get("search") || "";
  const currentPath = searchParams.get("currentPath") || "/";

  const [pages, setPages] = useState<AppPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState<string>(initialSearchValue);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch pages only once on mount
  useEffect(() => {
    setLoading(true);
    getTemplatePages()
      .then((result) => {
        if (result.success && result.pages) {
          setPages(result.pages);
        } else {
          setPages([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching pages:", error);
        setPages([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Only fetch once on mount, filter client-side

  // Listen for initial path from parent
  useEffect(() => {
    const updatePath = () => {
      if (window.parent && window.parent !== window) {
        try {
          const parentPath = window.parent.location.pathname;
          if (!isOpen) {
            setSearchValue(parentPath);
          }
        } catch {
          // Cross-origin or other error
        }
      }
    };
    updatePath();
  }, [isOpen]);

  // Handle search input changes - filter client-side, no reload needed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Ensure it always starts with "/"
    if (!value.startsWith("/")) {
      value = "/" + value.replace(/^\//g, "");
    }
    // Update local state immediately - filtering happens automatically via state
    setSearchValue(value);
    setIsOpen(true);
    // No need to update URL or send messages - filtering is client-side
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Position cursor at end
    setTimeout(() => {
      if (inputRef.current) {
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleBlur = () => {
    // Close after a delay to allow clicking on results
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isMenuFocused = activeElement?.closest("[data-page-navigator-menu]");
      if (!isMenuFocused) {
        setIsOpen(false);
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: "CLOSE_PAGE_NAVIGATOR_ON_BLUR",
            },
            window.location.origin
          );
        }
      }
    }, 100);
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handlePageClick = (path: string) => {
    // Send message to parent window to navigate
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "PAGE_NAVIGATOR_CLOSED",
        },
        window.location.origin
      );
      // Navigate parent window
      if (window.top) {
        window.top.location.href = path;
      }
    } else {
      // Fallback: navigate current window
      window.location.href = path;
    }
  };

  // Filter pages based on search value (use local state, not URL param)
  const searchWithoutSlash = searchValue.replace(/^\//, "");
  const effectiveSearchValue = searchValue || "";

  // Find root page (path === "/")
  const rootPage = pages.find((page) => page.path === "/");

  let filteredPages: AppPage[] = [];

  if (effectiveSearchValue === currentPath) {
    // Show all pages when search matches current path
    filteredPages = pages;
  } else if (!searchWithoutSlash || effectiveSearchValue === "/") {
    // If search is empty (just "/"), show only root page if it exists
    if (rootPage && rootPage.path === "/") {
      filteredPages = [rootPage];
    } else {
      filteredPages = [];
    }
  } else {
    // Filter when search is different from current path
    const searchLower = searchWithoutSlash.toLowerCase();
    filteredPages = pages.filter((page) => {
      if (!searchLower) return false;

      const pathSegments = page.path.toLowerCase().split("/").filter(Boolean);

      return pathSegments.some((segment) => {
        const words = segment
          .split(/[-_]/)
          .flatMap((word) => {
            return word.split(/(?=[A-Z])/).filter(Boolean);
          })
          .filter(Boolean);

        return words.some((word) => word.startsWith(searchLower));
      });
    });
  }

  // Highlight matching words in the path
  const renderPathWithHighlight = (page: AppPage) => {
    const searchLower = effectiveSearchValue.toLowerCase().replace(/^\//, "");
    if (!searchLower || effectiveSearchValue === currentPath) {
      return <span className="text-sm truncate flex-1">{page.path}</span>;
    }

    const pathSegments = page.path.split("/").filter(Boolean);
    const segments: React.ReactNode[] = [];

    pathSegments.forEach((segment, segmentIndex) => {
      if (segmentIndex > 0) segments.push("/");

      const words = segment
        .split(/[-_]/)
        .flatMap((word) => word.split(/(?=[A-Z])/).filter(Boolean))
        .filter(Boolean);

      const matchingWordIndex = words.findIndex((word) =>
        word.toLowerCase().startsWith(searchLower)
      );

      if (matchingWordIndex !== -1) {
        const segmentParts: React.ReactNode[] = [];
        let wordStartInSegment = 0;
        for (let i = 0; i < matchingWordIndex; i++) {
          const wordLower = words[i].toLowerCase();
          const wordPos = segment.toLowerCase().indexOf(wordLower, wordStartInSegment);
          if (wordPos !== -1) {
            wordStartInSegment = wordPos + words[i].length;
          }
        }

        const matchingWord = words[matchingWordIndex];
        const matchingWordLower = matchingWord.toLowerCase();
        const matchPos = segment.toLowerCase().indexOf(matchingWordLower, wordStartInSegment);

        if (matchPos !== -1) {
          if (matchPos > 0) {
            segmentParts.push(segment.substring(0, matchPos));
          }
          segmentParts.push(
            <span key="match" className="bg-primary/20 font-semibold">
              {segment.substring(matchPos, matchPos + searchLower.length)}
            </span>
          );
          if (matchPos + searchLower.length < segment.length) {
            segmentParts.push(segment.substring(matchPos + searchLower.length));
          }
          segments.push(<span key={segmentIndex}>{segmentParts}</span>);
        } else {
          segments.push(<span key={segmentIndex}>{segment}</span>);
        }
      } else {
        segments.push(<span key={segmentIndex}>{segment}</span>);
      }
    });

    return <span className="text-sm truncate flex-1">/{segments}</span>;
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Search Input - full width */}
      <div className="w-full px-4 py-3 bg-muted/60 border-b border-border/50">
        <Input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full cursor-pointer text-left focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0"
          placeholder="/page-path"
        />
      </div>
      {/* Results List */}
      <div
        className="flex flex-col py-1 flex-1 overflow-y-auto"
        style={{ paddingLeft: "20px", paddingRight: "20px" }}
      >
        {loading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Loading pages...</div>
        ) : filteredPages.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">No pages found</div>
        ) : (
          filteredPages.map((page) => {
            const isActive = page.path === currentPath;
            return (
              <Button
                key={page.id}
                variant="ghost"
                className={cn(
                  "w-full justify-between text-left font-normal h-auto py-2 px-3 rounded-none",
                  isActive && "bg-muted"
                )}
                onClick={() => handlePageClick(page.path)}
              >
                {renderPathWithHighlight(page)}
                {isActive && <Check className="h-4 w-4 ml-2 flex-shrink-0 text-primary" />}
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}
