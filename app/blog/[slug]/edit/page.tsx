import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/permissions";
import { isAdmin } from "@/lib/auth/permissions";
import { getBlogPostBySlug } from "@/app/actions/blog-posts";
import { getAppSettings } from "@/app/actions/app-settings";
import { AdminIframes } from "@/components/admin/AdminIframes";
import { EditBlogPostForm } from "./EditBlogPostForm";

export const dynamic = "force-dynamic";

interface EditBlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/blog/" + slug + "/edit");
  }

  const userIsAdmin = await isAdmin(currentUser.id);
  if (!userIsAdmin) {
    redirect("/blog");
  }

  const post = await getBlogPostBySlug(slug); // Include drafts for editing
  if (!post) {
    notFound();
  }

  const appSettings = await getAppSettings();

  return (
    <AdminIframes>
      <EditBlogPostForm post={post} appSettings={appSettings} currentUser={currentUser} />
    </AdminIframes>
  );
}
