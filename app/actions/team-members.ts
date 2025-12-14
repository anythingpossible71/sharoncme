"use server";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export interface TeamMemberData {
  id?: string;
  name: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  email?: string;
  order: number;
}

export async function getTeamMembers(): Promise<TeamMemberData[]> {
  try {
    const members = await prisma.teamMember.findMany({
      where: { deleted_at: null },
      orderBy: { order: "asc" },
    });

    return members.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      bio: member.bio || undefined,
      avatar_url: member.avatar_url || undefined,
      github_url: member.github_url || undefined,
      linkedin_url: member.linkedin_url || undefined,
      twitter_url: member.twitter_url || undefined,
      email: member.email || undefined,
      order: member.order,
    }));
  } catch (error) {
    logger.error("Failed to fetch team members", {}, error instanceof Error ? error : undefined);
    return [];
  }
}

export async function createTeamMember(data: Omit<TeamMemberData, "id">): Promise<{
  success: boolean;
  error?: string;
  id?: string;
}> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    const member = await prisma.teamMember.create({
      data: {
        name: data.name,
        role: data.role,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        github_url: data.github_url || null,
        linkedin_url: data.linkedin_url || null,
        twitter_url: data.twitter_url || null,
        email: data.email || null,
        order: data.order,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/components-settings/team");

    logger.info("Team member created", { memberId: member.id, name: member.name });

    return { success: true, id: member.id };
  } catch (error) {
    logger.error(
      "Failed to create team member",
      { data },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create team member",
    };
  }
}

export async function updateTeamMember(
  id: string,
  data: Omit<TeamMemberData, "id">
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.teamMember.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        github_url: data.github_url || null,
        linkedin_url: data.linkedin_url || null,
        twitter_url: data.twitter_url || null,
        email: data.email || null,
        order: data.order,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/components-settings/team");

    logger.info("Team member updated", { memberId: id });

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to update team member",
      { id, data },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update team member",
    };
  }
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.teamMember.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    revalidatePath("/");
    revalidatePath("/admin/components-settings/team");

    logger.info("Team member deleted", { memberId: id });

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to delete team member",
      { id },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete team member",
    };
  }
}

export async function reorderTeamMembers(
  memberIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    // Update order for each member
    await prisma.$transaction(
      memberIds.map((id, index) =>
        prisma.teamMember.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/admin/components-settings/team");

    logger.info("Team members reordered", { count: memberIds.length });

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to reorder team members",
      { memberIds },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder team members",
    };
  }
}
