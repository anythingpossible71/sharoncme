import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export default function PagesResultLayout({ children }: { children: React.ReactNode }) {
  return <AdminThemeProvider defaultTheme="light">{children}</AdminThemeProvider>;
}
