import { getCurrentUser } from "@/lib/auth/permissions";
import { getBlogPosts } from "@/app/actions/blog-posts";
import { getAppSettings } from "@/app/actions/app-settings";
import { InnerPageTemplate } from "@/components/templates/InnerPageTemplate";
import Link from "next/link";
import { Calendar, User, FileText, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";
import { BlogPostActions } from "@/components/blog/BlogPostActions";
import { isAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read our latest blog posts and articles",
};

export default async function BlogArchivePage() {
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();
  const posts = await getBlogPosts();
  const isUserAdmin = currentUser ? await isAdmin(currentUser.id) : false;

  // Separate published and draft posts
  const publishedPosts = posts.filter((post) => post.status === "published");
  const draftPosts = isUserAdmin ? posts.filter((post) => post.status === "draft") : [];

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <InnerPageTemplate
      currentUser={currentUser}
      appName={appSettings.appName}
      appLogoUrl={appSettings.appLogoUrl}
      heroTitle="Blog"
      heroSubtitle="Read our latest articles and updates"
      heroIcon={<BookOpen className="h-6 w-6 text-primary" />}
    >
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {publishedPosts.length === 0 && draftPosts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg mb-4">No blog posts yet.</p>
                    {isUserAdmin && (
                      <Link
                        href="/blog/create"
                        className="inline-block text-primary hover:underline font-medium"
                      >
                        Create your first post
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Published Posts */}
                {publishedPosts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publishedPosts.map((post) => (
                      <Card key={post.id} className="flex flex-col">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-xl line-clamp-2">
                              <Link
                                href={`/blog/${post.slug}`}
                                className="hover:text-primary transition-colors"
                              >
                                {post.title}
                              </Link>
                            </CardTitle>
                            {isUserAdmin && <BlogPostActions post={post} />}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(post.published_at)}
                            </span>
                            {post.author && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {post.author.name || post.author.email}
                              </span>
                            )}
                          </div>
                          {post.excerpt && (
                            <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                              {post.excerpt}
                            </p>
                          )}
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-primary hover:underline font-medium text-sm mt-auto"
                          >
                            Read more →
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Draft Posts (Admin Only) */}
                {draftPosts.length > 0 && (
                  <div className="mt-12 pt-12 border-t">
                    <h2 className="text-2xl font-semibold mb-6 text-muted-foreground">Drafts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {draftPosts.map((post) => (
                        <Card key={post.id} className="flex flex-col opacity-75">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-xl line-clamp-2">
                                <Link
                                  href={`/blog/${post.slug}`}
                                  className="hover:text-primary transition-colors"
                                >
                                  {post.title}
                                </Link>
                                <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                                  Draft
                                </span>
                              </CardTitle>
                              <BlogPostActions post={post} />
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Created {formatDate(post.created_at)}
                              </span>
                              {post.author && (
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {post.author.name || post.author.email}
                                </span>
                              )}
                            </div>
                            {post.excerpt && (
                              <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                                {post.excerpt}
                              </p>
                            )}
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-primary hover:underline font-medium text-sm mt-auto"
                            >
                              View draft →
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </InnerPageTemplate>
  );
}
