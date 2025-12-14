"use client";

import { useRef } from "react";
import {
  EnvironmentVariablesDisplay,
  EnvironmentVariablesDisplayRef,
} from "@/components/admin/EnvironmentVariablesDisplay";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Button } from "@/components/admin-ui/button";
import { Plus } from "lucide-react";

export default function AdminEnvironmentPage() {
  const displayRef = useRef<EnvironmentVariablesDisplayRef>(null);

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        sectionName="Environment Variables"
        actionButtons={
          <Button onClick={() => displayRef.current?.openAddDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        }
      />

      <EnvironmentVariablesDisplay ref={displayRef} />
    </div>
  );
}
