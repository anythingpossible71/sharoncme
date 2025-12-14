"use client";

import { useState, useMemo, useEffect } from "react";
import { SupportedService } from "@/app/actions/connected-services";
import { ConnectedServicesClient } from "./ConnectedServicesClient";
import { AddServiceDialog } from "./AddServiceDialog";
import { Card, CardContent } from "@/components/admin-ui/card";

interface ConnectedServicesPageClientProps {
  allServices: SupportedService[];
}

function isServiceConnected(service: SupportedService): boolean {
  const requiredVars = service.variables.filter((v) => v.required);
  return requiredVars.length > 0 && requiredVars.every((v) => v.value && v.value.trim() !== "");
}

interface WindowWithDialog extends Window {
  __openAddServiceDialog?: () => void;
}

export function ConnectedServicesPageClient({ allServices }: ConnectedServicesPageClientProps) {
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState<Record<string, boolean>>({});

  // Expose dialog open function to parent
  useEffect(() => {
    const win = window as WindowWithDialog;
    win.__openAddServiceDialog = () => setAddServiceDialogOpen(true);
    return () => {
      delete win.__openAddServiceDialog;
    };
  }, []);

  // Filter to show only connected services
  const connectedServices = allServices.filter(isServiceConnected);

  // Group connected services by category
  const servicesByCategory = connectedServices.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, typeof connectedServices>
  );

  const handleConnectFromDialog = (service: SupportedService) => {
    setAddServiceDialogOpen(false);
    // Open the connection dialog for this service
    setServiceDialogOpen((prev) => ({ ...prev, [service.id]: true }));
  };

  // Get all services (including unconnected) for the dialog
  const allServicesForDialog = useMemo(() => allServices, [allServices]);

  return (
    <>
      <Card>
        <CardContent className="space-y-6 pt-6">
          {Object.keys(servicesByCategory).length === 0 ? (
            <div className="bg-muted/50 border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No connected services configured yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(servicesByCategory).map(([category, categoryServices]) => {
                // Convert category to camelCase (first letter uppercase, rest lowercase)
                const categoryDisplay =
                  category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
                return (
                  <div key={category}>
                    <h5 className="text-lg font-semibold mb-4">{categoryDisplay}</h5>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {categoryServices.map((service) => (
                        <ConnectedServicesClient
                          key={service.id}
                          service={service}
                          forceDialogOpen={serviceDialogOpen[service.id]}
                          onDialogOpenChange={(open) => {
                            setServiceDialogOpen((prev) => ({ ...prev, [service.id]: open }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddServiceDialog
        open={addServiceDialogOpen}
        onOpenChange={setAddServiceDialogOpen}
        services={allServicesForDialog}
        onConnect={handleConnectFromDialog}
      />

      {/* Render unconnected services as hidden components so we can open their dialogs */}
      {allServices
        .filter((service) => !isServiceConnected(service))
        .map((service) => (
          <div key={service.id} className="hidden">
            <ConnectedServicesClient
              service={service}
              forceDialogOpen={serviceDialogOpen[service.id]}
              onDialogOpenChange={(open) => {
                setServiceDialogOpen((prev) => ({ ...prev, [service.id]: open }));
              }}
            />
          </div>
        ))}
    </>
  );
}
