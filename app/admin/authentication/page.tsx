import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/permissions";
import { AuthenticationLayout } from "@/components/admin/AuthenticationLayout";
import { AuthenticationTabsClient } from "@/app/admin/authentication/page-client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

async function getRoles() {
  return prisma.role.findMany({
    where: {
      deleted_at: null,
    },
    orderBy: {
      id: "asc",
    },
  });
}

async function getRolesWithCounts() {
  const roles = await prisma.role.findMany({
    where: {
      deleted_at: null,
    },
    orderBy: {
      id: "asc",
    },
    include: {
      _count: {
        select: {
          users: {
            where: {
              deleted_at: null,
              user: {
                deleted_at: null,
              },
            },
          },
        },
      },
    },
  });

  // Convert dates to ISO strings for client component
  type RoleWithCount = (typeof roles)[number];
  return roles.map((role: RoleWithCount) => ({
    ...role,
    created_at: role.created_at.toISOString(),
    updated_at: role.updated_at.toISOString(),
    deleted_at: role.deleted_at?.toISOString() ?? null,
  }));
}

async function getUsers(page: number = 1, search?: string) {
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // For SQLite, we need to handle case-insensitive search manually
  const where = search
    ? {
        deleted_at: null,
        OR: [
          {
            email: {
              contains: search.toLowerCase(),
            },
          },
          {
            name: {
              contains: search.toLowerCase(),
            },
          },
        ],
      }
    : {
        deleted_at: null,
      };

  const [users, count] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { created_at: "desc" },
      include: {
        profile: true,
        roles: {
          where: {
            deleted_at: null,
          },
          include: {
            role: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Convert dates to ISO strings for client component
  type UserWithRelations = (typeof users)[number];
  const serializedUsers = users.map((user: UserWithRelations) => ({
    ...user,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    deleted_at: user.deleted_at?.toISOString() ?? null,
    last_signed_in: user.last_signed_in?.toISOString() ?? null,
    profile: user.profile
      ? {
          ...user.profile,
          created_at: user.profile.created_at.toISOString(),
          updated_at: user.profile.updated_at.toISOString(),
          deleted_at: user.profile.deleted_at?.toISOString() ?? null,
        }
      : null,
    roles: user.roles.map((userRole: UserWithRelations["roles"][number]) => ({
      ...userRole,
      created_at: userRole.created_at.toISOString(),
      updated_at: userRole.updated_at.toISOString(),
      deleted_at: userRole.deleted_at?.toISOString() ?? null,
      role: {
        ...userRole.role,
        created_at: userRole.role.created_at.toISOString(),
        updated_at: userRole.role.updated_at.toISOString(),
        deleted_at: userRole.role.deleted_at?.toISOString() ?? null,
      },
    })),
  }));

  return { users: serializedUsers, count };
}

export default async function AuthenticationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search;
  const activeTab = params.tab || "users";

  // Fetch all data in parallel
  const [{ users, count }, currentUser, roles, rolesWithCounts] = await Promise.all([
    getUsers(page, search),
    getCurrentUser().catch(() => null),
    getRoles(),
    getRolesWithCounts(),
  ]);

  return (
    <AuthenticationLayout
      activeTab={activeTab}
      tabsComponent={
        <AuthenticationTabsClient
          users={users}
          count={count}
          page={page}
          itemsPerPage={ITEMS_PER_PAGE}
          currentUserId={currentUser?.id || ""}
          availableRoles={roles}
          roles={rolesWithCounts}
          activeTab={activeTab}
          showTabsOnly={true}
        />
      }
    >
      <AuthenticationTabsClient
        users={users}
        count={count}
        page={page}
        itemsPerPage={ITEMS_PER_PAGE}
        currentUserId={currentUser?.id || ""}
        availableRoles={roles}
        roles={rolesWithCounts}
        activeTab={activeTab}
      />
    </AuthenticationLayout>
  );
}
