"use client";

import { useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin-ui/tabs";
import {
  UserManagementPanel,
  UserManagementPanelRef,
} from "@/components/admin/UserManagementPanel";
import {
  RoleManagementPanel,
  RoleManagementPanelRef,
} from "@/components/admin/RoleManagementPanel";
import { AuthConfigForm } from "@/components/admin/AuthConfigForm";
import { Users, Shield, Fingerprint } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  created_at: string;
  last_signed_in: string | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  roles: {
    role: {
      name: string;
    };
  }[];
};

type Role = {
  id: string;
  name: string;
};

type RoleWithCount = {
  id: string;
  name: string;
  created_at: string;
  _count: {
    users: number;
  };
};

interface AuthenticationTabsClientProps {
  users: User[];
  count: number;
  page: number;
  itemsPerPage: number;
  currentUserId: string;
  availableRoles: Role[];
  roles: RoleWithCount[];
  activeTab: string;
  showTabsOnly?: boolean;
}

export function AuthenticationTabsClient({
  users,
  count,
  page,
  itemsPerPage,
  currentUserId,
  availableRoles,
  roles,
  activeTab,
  showTabsOnly = false,
}: AuthenticationTabsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const usersPanelRef = useRef<UserManagementPanelRef>(null);
  const rolesPanelRef = useRef<RoleManagementPanelRef>(null);

  // Listen for custom events to open dialogs
  useEffect(() => {
    const handleOpenCreateUserDialog = () => {
      usersPanelRef.current?.openCreateDialog();
    };

    const handleOpenCreateRoleDialog = () => {
      rolesPanelRef.current?.openCreateDialog();
    };

    window.addEventListener("openCreateUserDialog", handleOpenCreateUserDialog);
    window.addEventListener("openCreateRoleDialog", handleOpenCreateRoleDialog);

    return () => {
      window.removeEventListener("openCreateUserDialog", handleOpenCreateUserDialog);
      window.removeEventListener("openCreateRoleDialog", handleOpenCreateRoleDialog);
    };
  }, []);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/admin/authentication?${params.toString()}`);
  };

  // Custom tabs list for breadcrumb (hugs content, not stretched)
  const tabsList = (
    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
      <button
        onClick={() => handleTabChange("users")}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          activeTab === "users"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50"
        }`}
      >
        <Users className="h-4 w-4 mr-2" />
        Users
      </button>
      <button
        onClick={() => handleTabChange("roles")}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          activeTab === "roles"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50"
        }`}
      >
        <Shield className="h-4 w-4 mr-2" />
        Roles
      </button>
      <button
        onClick={() => handleTabChange("auth")}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          activeTab === "auth"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50"
        }`}
      >
        <Fingerprint className="h-4 w-4 mr-2" />
        Auth Settings
      </button>
    </div>
  );

  if (showTabsOnly) {
    // Just render the tabs list for the breadcrumb
    return tabsList;
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      {/* TabsList is rendered in breadcrumb, so hide it here */}
      <div className="hidden">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Auth Settings
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="users" className="mt-0">
        <UserManagementPanel
          ref={usersPanelRef}
          initialUsers={users}
          totalCount={count}
          currentPage={page}
          itemsPerPage={itemsPerPage}
          currentUserId={currentUserId}
          availableRoles={availableRoles}
        />
      </TabsContent>

      <TabsContent value="roles" className="mt-0">
        <RoleManagementPanel ref={rolesPanelRef} initialRoles={roles} />
      </TabsContent>

      <TabsContent value="auth" className="mt-0">
        <AuthConfigForm />
      </TabsContent>
    </Tabs>
  );
}
