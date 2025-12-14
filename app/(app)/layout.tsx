import { AppSidebarLayout } from "@/components/layouts/app-sidebar/AppSidebarLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppSidebarLayout>{children}</AppSidebarLayout>;
}
