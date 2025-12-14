import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/permissions";
import { isAdmin } from "@/lib/auth/permissions";
import { getAppSettings } from "@/app/actions/app-settings";
import { AdminIframes } from "@/components/admin/AdminIframes";
import { CreateBlogPostForm } from "./CreateBlogPostForm";

export const dynamic = "force-dynamic";

export default async function CreateBlogPostPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/blog/create");
  }

  const userIsAdmin = await isAdmin(currentUser.id);
  if (!userIsAdmin) {
    redirect("/blog");
  }

  const appSettings = await getAppSettings();

  return (
    <AdminIframes>
      <CreateBlogPostForm appSettings={appSettings} currentUser={currentUser} />
    </AdminIframes>
  );
}
