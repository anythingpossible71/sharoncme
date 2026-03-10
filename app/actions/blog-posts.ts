"use server";

import { auth } from "@/lib/auth";
import { hasRole, isAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";
import type { SerializedEditorState } from "lexical";

export interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string; // Serialized Lexical JSON
  excerpt?: string;
  status: "draft" | "published";
  author_id: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a number if needed
 */
async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const existing = await prisma.blogPost.findFirst({
      where: {
        slug: uniqueSlug,
        deleted_at: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (!existing) {
      return uniqueSlug;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}

/**
 * Get blog posts with filtering based on user permissions
 */
export async function getBlogPosts(
  status?: "draft" | "published" | "all"
): Promise<BlogPostData[]> {
  try {
    const session = await auth();
    const isUserAdmin = session?.user?.id ? await isAdmin(session.user.id) : false;

    const where: {
      deleted_at: null;
      status?: "draft" | "published";
    } = {
      deleted_at: null,
    };

    // If user is not admin, only show published posts
    if (!isUserAdmin) {
      where.status = "published";
    } else if (status && status !== "all") {
      // Admin can filter by status
      where.status = status;
    }
    // If admin and status is "all" or undefined, show all posts

    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        // Published posts by published_at DESC, drafts by created_at DESC
        { published_at: "desc" },
        { created_at: "desc" },
      ],
    });

    return posts.map((post: (typeof posts)[number]) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || undefined,
      status: post.status as "draft" | "published",
      author_id: post.author_id,
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name,
            email: post.author.email,
          }
        : undefined,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
    }));
  } catch (error) {
    logger.error("Failed to fetch blog posts", {}, error instanceof Error ? error : undefined);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPostData | null> {
  try {
    const session = await auth();
    const isUserAdmin = session?.user?.id ? await isAdmin(session.user.id) : false;

    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        deleted_at: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    // Check visibility: published posts are public, drafts require admin
    if (post.status === "draft" && !isUserAdmin) {
      return null; // Don't reveal that draft exists
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || undefined,
      status: post.status as "draft" | "published",
      author_id: post.author_id,
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name,
            email: post.author.email,
          }
        : undefined,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
    };
  } catch (error) {
    logger.error("Failed to fetch blog post", { slug }, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Create a new blog post (admin only)
 */
export async function createBlogPost(data: {
  title: string;
  slug?: string;
  content: string; // Serialized Lexical JSON
  excerpt?: string;
}): Promise<{ success: boolean; error?: string; id?: string; slug?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    // Generate slug from title if not provided
    const baseSlug = data.slug || generateSlug(data.title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: uniqueSlug,
        content: data.content,
        excerpt: data.excerpt || null,
        status: "draft", // Always start as draft
        author_id: session.user.id,
      },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    logger.info("Blog post created", { postId: post.id, slug: post.slug, title: post.title });

    return { success: true, id: post.id, slug: post.slug };
  } catch (error) {
    logger.error(
      "Failed to create blog post",
      { data },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create blog post",
    };
  }
}

/**
 * Update a blog post (admin only)
 */
export async function updateBlogPost(
  id: string,
  data: {
    title?: string;
    slug?: string;
    content?: string; // Serialized Lexical JSON
    excerpt?: string;
    status?: "draft" | "published";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    // Get existing post to check status
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost || existingPost.deleted_at) {
      return { success: false, error: "Post not found" };
    }

    // Cannot change status from published to draft
    if (existingPost.status === "published" && data.status === "draft") {
      // Published posts cannot be reverted to draft
      return { success: false, error: "Cannot revert published post to draft" };
    }

    // Handle slug uniqueness if slug is being updated
    let finalSlug = data.slug;
    if (data.slug && data.slug !== existingPost.slug) {
      finalSlug = await ensureUniqueSlug(data.slug, id);
    } else if (data.title && !data.slug) {
      // If title changed but slug didn't, regenerate slug
      const baseSlug = generateSlug(data.title);
      finalSlug = await ensureUniqueSlug(baseSlug, id);
    }

    await prisma.blogPost.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(finalSlug && { slug: finalSlug }),
        ...(data.content && { content: data.content }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt || null }),
        ...(data.status && { status: data.status }),
        ...(data.status === "published" &&
          !existingPost.published_at && { published_at: new Date() }),
      },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${existingPost.slug}`);
    if (finalSlug && finalSlug !== existingPost.slug) {
      revalidatePath(`/blog/${finalSlug}`);
    }

    logger.info("Blog post updated", { postId: id });

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to update blog post",
      { id, data },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update blog post",
    };
  }
}

/**
 * Publish a draft blog post (admin only)
 */
export async function publishBlogPost(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post || post.deleted_at) {
      return { success: false, error: "Post not found" };
    }

    if (post.status === "published") {
      // Already published - allow re-publishing (updates published_at)
      await prisma.blogPost.update({
        where: { id },
        data: {
          published_at: new Date(),
        },
      });
    } else {
      // Publish draft
      await prisma.blogPost.update({
        where: { id },
        data: {
          status: "published",
          published_at: new Date(),
        },
      });
    }

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    logger.info("Blog post published", { postId: id, slug: post.slug });

    return { success: true };
  } catch (error) {
    logger.error("Failed to publish blog post", { id }, error instanceof Error ? error : undefined);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish blog post",
    };
  }
}

/**
 * Delete a blog post (soft delete, admin only)
 */
export async function deleteBlogPost(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    await prisma.blogPost.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    logger.info("Blog post deleted", { postId: id });

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete blog post", { id }, error instanceof Error ? error : undefined);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete blog post",
    };
  }
}
