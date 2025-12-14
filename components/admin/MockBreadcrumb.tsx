"use client";

interface MockBreadcrumbProps {
  tabName: string;
}

export function MockBreadcrumb({ tabName }: MockBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-lg">
      <span className="font-medium text-foreground">{tabName}</span>
    </nav>
  );
}
