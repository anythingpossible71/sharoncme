"use client";

import { useRef, useEffect } from "react";
import {
  RoleManagementPanel,
  RoleManagementPanelRef,
} from "@/components/admin/RoleManagementPanel";

type Role = {
  id: string;
  name: string;
  created_at: string;
  _count: {
    users: number;
  };
};

interface RolesPageClientProps {
  roles: Role[];
}

export function RolesPageClient({ roles }: RolesPageClientProps) {
  const panelRef = useRef<RoleManagementPanelRef>(null);

  // Listen for custom events to open dialogs
  useEffect(() => {
    const handleOpenCreateRoleDialog = () => {
      panelRef.current?.openCreateDialog();
    };

    window.addEventListener("openCreateRoleDialog", handleOpenCreateRoleDialog);

    return () => {
      window.removeEventListener("openCreateRoleDialog", handleOpenCreateRoleDialog);
    };
  }, []);

  return <RoleManagementPanel ref={panelRef} initialRoles={roles} />;
}
