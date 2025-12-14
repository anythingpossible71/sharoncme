import { MarketingLayout } from "@/components/layouts/marketing/MarketingLayout";

export default function MarketingLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>;
}
