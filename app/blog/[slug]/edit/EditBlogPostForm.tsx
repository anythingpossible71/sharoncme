"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooter } from "@/components/pages/PageFooter";
import { BlogEditor } from "@/components/blog/BlogEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateBlogPost } from "@/app/actions/blog-posts";
import { useToast } from "@/hooks/use-toast";
import type { SerializedEditorState } from "lexical";
import { Save } from "lucide-react";
import type { BlogPostData } from "@/app/actions/blog-posts";
import type { CurrentUserWithRoles } from "@/lib/auth/permissions";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

interface EditBlogPostFormProps {
  post: BlogPostData;
  appSettings: {
    appName: string;
    appLogoUrl?: string | null;
  };
  currentUser: CurrentUserWithRoles;
}

export function EditBlogPostForm({ post, appSettings, currentUser }: EditBlogPostFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  // Initialize editor with post content
  const [editorContent, setEditorContent] = useState<SerializedEditorState | null>(() => {
    try {
      return JSON.parse(post.content);
    } catch {
      return null;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      status: post.status,
    },
  });

  const status = watch("status");

  const onSubmit = async (data: BlogPostFormData) => {
    if (!editorContent) {
      toast({
        title: "Error",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateBlogPost(post.id, {
        title: data.title,
        slug: data.slug,
        content: JSON.stringify(editorContent),
        excerpt: data.excerpt || undefined,
        status: data.status,
      });

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to update post",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post updated",
        description: "Your post has been updated successfully",
      });

      router.push(`/blog/${data.slug}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        currentUser={currentUser}
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl || undefined}
      />

      <main className="container mx-auto px-4 py-8 md:py-12 lg:py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Edit Blog Post</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  URL-friendly version of the title
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

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setValue("status", value as "draft" | "published")}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogEditor
                initialContent={editorContent || undefined}
                onChange={() => {}}
                onSerializedChange={(serialized) => {
                  setEditorContent(serialized);
                }}
                placeholder="Start writing your post..."
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>

      <PageFooter appName={appSettings.appName} />
    </>
  );
}
