"use client";

import { useRef, useEffect } from "react";
import {
  UserManagementPanel,
  UserManagementPanelRef,
} from "@/components/admin/UserManagementPanel";

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

interface UsersPageClientProps {
  users: User[];
  count: number;
  page: number;
  itemsPerPage: number;
  currentUserId: string;
  availableRoles: Role[];
}

export function UsersPageClient({
  users,
  count,
  page,
  itemsPerPage,
  currentUserId,
  availableRoles,
}: UsersPageClientProps) {
  const panelRef = useRef<UserManagementPanelRef>(null);

  // Listen for custom events to open dialogs
  useEffect(() => {
    const handleOpenCreateUserDialog = () => {
      panelRef.current?.openCreateDialog();
    };

    window.addEventListener("openCreateUserDialog", handleOpenCreateUserDialog);

    return () => {
      window.removeEventListener("openCreateUserDialog", handleOpenCreateUserDialog);
    };
  }, []);

  return (
    <UserManagementPanel
      ref={panelRef}
      initialUsers={users}
      totalCount={count}
      currentPage={page}
      itemsPerPage={itemsPerPage}
      currentUserId={currentUserId}
      availableRoles={availableRoles}
    />
  );
}
