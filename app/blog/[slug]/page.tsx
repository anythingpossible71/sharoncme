import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/permissions";
import { getBlogPostBySlug } from "@/app/actions/blog-posts";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { getAppSettings } from "@/app/actions/app-settings";
import { AdminIframes } from "@/components/admin/AdminIframes";
import { BlogPostRenderer } from "@/components/blog/BlogPostRenderer";
import { BlogPostActions } from "@/components/blog/BlogPostActions";
import { Calendar, User } from "lucide-react";
import { isAdmin } from "@/lib/auth/permissions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status === "draft") {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on our blog`,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();
  const post = await getBlogPostBySlug(slug);
  const isUserAdmin = currentUser ? await isAdmin(currentUser.id) : false;

  // Check visibility: published posts are public, drafts require admin
  if (!post || (post.status === "draft" && !isUserAdmin)) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <AdminIframes>
      <PageHeader
        currentUser={currentUser}
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl}
      />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article>
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.published_at)}
                    </span>
                  )}
                  {post.author && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author.name || post.author.email}
                    </span>
                  )}
                  {post.status === "draft" && (
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                      Draft
                    </span>
                  )}
                </div>
                {post.excerpt && (
                  <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
                )}
              </div>
              {isUserAdmin && <BlogPostActions post={post} />}
            </div>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <BlogPostRenderer content={post.content} />
          </div>
        </article>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/blog" className="text-primary hover:underline font-medium">
            ← Back to Blog
          </Link>
        </div>
      </main>

      <PageFooterExtended appName={appSettings.appName} appLogoUrl={appSettings.appLogoUrl} />
    </AdminIframes>
  );
}
