import type { NavigationItem } from "@/lib/admin/navigation-types";

/**
 * Derives breadcrumb information from navigation items based on the current pathname.
 * This makes breadcrumbs dynamic and automatically update when navigation structure changes.
 *
 * Logic:
 * 1. First checks if pathname matches any top-level navigation item
 * 2. Then checks submenu items
 * 3. If a submenu item is also a top-level item (like Users, Media, Templates),
 *    it shows as top-level section, not as subsection
 * 4. Falls back to pathname-based inference if no match found
 */
export function getBreadcrumbFromNavigation(
  navigationItems: NavigationItem[],
  pathname: string
): { sectionName: string; sectionHref?: string; subsectionName?: string; subsectionHref?: string } {
  // Helper to check if pathname matches href
  const matches = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href + "/") || pathname === href;
  };

  // Build a map of all hrefs to their labels for quick lookup
  const hrefToLabel = new Map<string, string>();
  navigationItems.forEach((item) => {
    hrefToLabel.set(item.href, item.label);
    item.submenu?.forEach((subitem) => {
      hrefToLabel.set(subitem.href, subitem.label);
    });
  });

  // First check for exact matches on top-level items (before submenu and prefix checks)
  // This prevents /admin from matching /admin/storage, /admin/authentication, etc.
  for (const item of navigationItems) {
    if (!item.hidden && pathname === item.href) {
      // Exact match on top-level item
      return { sectionName: item.label, sectionHref: item.href };
    }
  }

  // Then check submenu items (before prefix matches on top-level items)
  // If found in a submenu, always show as parent > child, regardless of top-level status
  // This ensures nested pages show their hierarchy even if they're also hidden top-level items
  for (const item of navigationItems) {
    if (item.submenu) {
      for (const subitem of item.submenu) {
        if (matches(subitem.href)) {
          // Found in submenu - always show as parent > child
          return {
            sectionName: item.label,
            sectionHref: item.href,
            subsectionName: subitem.label,
            subsectionHref: subitem.href,
          };
        }
      }
    }
  }

  // Then check if pathname matches any top-level navigation item with prefix match
  // Skip hidden items - they should be handled by submenu check above
  // Only use prefix match if exact match wasn't found above
  for (const item of navigationItems) {
    if (!item.hidden && pathname.startsWith(item.href + "/")) {
      // Prefix match on top-level item (e.g., /admin/storage matches /admin/storage)
      return { sectionName: item.label, sectionHref: item.href };
    }
  }

  // Fallback: try to find by pathname segments
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 3) {
    // /admin/[section]/[subsection]
    const fullPath = `/${segments.join("/")}`;

    // Check if we have a label for this exact path
    if (hrefToLabel.has(fullPath)) {
      const label = hrefToLabel.get(fullPath)!;
      // Check if it's a top-level item
      const isTopLevel = navigationItems.some((item) => item.href === fullPath && !item.submenu);
      if (isTopLevel) {
        return { sectionName: label, sectionHref: fullPath };
      }
    }

    // Try to find parent section
    const sectionPath = `/${segments[0]}/${segments[1]}`;
    const parentItem = navigationItems.find((item) => item.href === sectionPath);
    if (parentItem) {
      return {
        sectionName: parentItem.label,
        sectionHref: parentItem.href,
        subsectionName: segments[2]
          ? segments[2].charAt(0).toUpperCase() + segments[2].slice(1).replace(/-/g, " ")
          : undefined,
        subsectionHref: fullPath,
      };
    }
  }

  // Last resort: use the last segment as section name
  const lastSegment = segments[segments.length - 1];
  return {
    sectionName: lastSegment
      ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ")
      : "Admin",
    sectionHref: pathname,
  };
}
