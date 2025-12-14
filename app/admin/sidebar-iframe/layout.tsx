import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import "./layout.css";

export default async function SidebarIframeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <div className="h-screen">{children}</div>
    </AdminThemeProvider>
  );
}
