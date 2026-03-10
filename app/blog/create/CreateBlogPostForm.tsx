"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { BlogEditor } from "@/components/blog/BlogEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBlogPost, publishBlogPost } from "@/app/actions/blog-posts";
import { useToast } from "@/hooks/use-toast";
import type { SerializedEditorState } from "lexical";
import { ArrowLeft, Save, Send } from "lucide-react";
import Link from "next/link";
import type { CurrentUserWithRoles } from "@/lib/auth/permissions";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

interface CreateBlogPostFormProps {
  appSettings: {
    appName: string;
    appLogoUrl?: string | null;
  };
  currentUser: CurrentUserWithRoles;
}

export function CreateBlogPostForm({ appSettings, currentUser }: CreateBlogPostFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editorContent, setEditorContent] = useState<SerializedEditorState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
    },
  });

  const title = watch("title");

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !watch("slug")) {
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  }, [title, setValue, watch]);

  const onSubmit = async (data: BlogPostFormData, publish: boolean = false) => {
    if (!editorContent) {
      toast({
        title: "Error",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      // Create the post
      const result = await createBlogPost({
        title: data.title,
        slug: data.slug,
        content: JSON.stringify(editorContent),
        excerpt: data.excerpt || undefined,
      });

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to create post",
          variant: "destructive",
        });
        return;
      }

      // If publishing, publish the post
      if (publish && result.id) {
        const publishResult = await publishBlogPost(result.id);
        if (!publishResult.success) {
          toast({
            title: "Post created",
            description: "Post created as draft, but failed to publish",
            variant: "destructive",
          });
          router.push(`/blog/${result.slug}`);
          return;
        }
      }

      toast({
        title: publish ? "Post published" : "Post saved",
        description: publish
          ? "Your post has been published successfully"
          : "Your post has been saved as a draft",
      });

      router.push(`/blog/${result.slug}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsPublishing(false);
    }
  };

  return (
    <>
      <PageHeader
        currentUser={currentUser}
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl || undefined}
      />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
          <h1 className="text-4xl font-bold">Create New Post</h1>
        </div>

        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title")} placeholder="Enter post title" />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...register("slug")} placeholder="post-url-slug" />
                {errors.slug && (
                  <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  URL-friendly version of the title (auto-generated)
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                <Textarea
                  id="excerpt"
                  {...register("excerpt")}
                  placeholder="A brief summary of your post"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogEditor
                onChange={() => {
                  // Editor state changed
                }}
                onSerializedChange={(serialized) => {
                  setEditorContent(serialized);
                }}
                placeholder="Start writing your post..."
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button type="submit" variant="outline" disabled={isSubmitting || isPublishing}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isSubmitting || isPublishing}
            >
              <Send className="mr-2 h-4 w-4" />
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </form>
      </main>

      <PageFooterExtended
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl || undefined}
      />
    </>
  );
}
