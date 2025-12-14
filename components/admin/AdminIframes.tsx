import { getCurrentUser, isAdmin } from "@/lib/auth/permissions";
import { SidebarToggle } from "@/components/admin/SidebarToggle";
import { AdminIframesClient } from "@/components/admin/AdminIframesClient";

interface AdminIframesProps {
  children: React.ReactNode;
}

export async function AdminIframes({ children }: AdminIframesProps) {
  // Check if user is authenticated and is admin
  const currentUser = await getCurrentUser();
  const isUserAdmin = currentUser ? await isAdmin(currentUser.id) : false;

  // Only render admin iframes if user is authenticated and is admin
  if (!currentUser || !isUserAdmin) {
    return <>{children}</>;
  }

  return (
    <div
      className="bg-muted/60 m-0 p-0"
      style={{
        margin: 0,
        padding: 0,
        marginTop: 0,
        paddingTop: 0,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <AdminIframesClient>
        <SidebarToggle isAdmin={true}>{children}</SidebarToggle>
      </AdminIframesClient>
    </div>
  );
}
