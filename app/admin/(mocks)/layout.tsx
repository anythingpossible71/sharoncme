import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export default async function MocksLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      {children}
    </AdminThemeProvider>
  );
}

