import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      {/* Main content area with padding-top to account for fixed header */}
      <main className="flex-1 pt-16">{children}</main>

      <MarketingFooter />
    </div>
  );
}
