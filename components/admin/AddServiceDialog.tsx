"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/admin-ui/dialog";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin-ui/select";
import { SupportedService } from "@/app/actions/connected-services";
import { Route } from "lucide-react";
import { Separator } from "@/components/admin-ui/separator";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: SupportedService[];
  onConnect: (service: SupportedService) => void;
}

type SortOption = "alphabet" | "category";

function isServiceConnected(service: SupportedService): boolean {
  const requiredVars = service.variables.filter((v) => v.required);
  return requiredVars.length > 0 && requiredVars.every((v) => v.value && v.value.trim() !== "");
}

export function AddServiceDialog({
  open,
  onOpenChange,
  services,
  onConnect,
}: AddServiceDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("alphabet");

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  // Filter out connected services and apply search/sorting
  const { groupedServices, flatServices } = useMemo(() => {
    let filtered = services.filter((service) => !isServiceConnected(service));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.category.toLowerCase().includes(query)
      );
    }

    if (sortBy === "alphabet") {
      // Flat list sorted alphabetically
      const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      return { groupedServices: null, flatServices: sorted };
    } else {
      // Group by category, sort categories alphabetically, sort services alphabetically within each category
      const grouped = filtered.reduce(
        (acc, service) => {
          if (!acc[service.category]) {
            acc[service.category] = [];
          }
          acc[service.category].push(service);
          return acc;
        },
        {} as Record<string, typeof filtered>
      );

      // Sort services alphabetically within each category
      Object.keys(grouped).forEach((category) => {
        grouped[category].sort((a, b) => a.name.localeCompare(b.name));
      });

      // Sort categories alphabetically
      const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
      const sortedGrouped: Record<string, typeof filtered> = {};
      sortedCategories.forEach((category) => {
        sortedGrouped[category] = grouped[category];
      });

      return { groupedServices: sortedGrouped, flatServices: null };
    }
  }, [services, searchQuery, sortBy]);

  const handleConnect = (service: SupportedService) => {
    onConnect(service);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Connect a new Service</DialogTitle>
          <DialogDescription>Select a service to connect and configure.</DialogDescription>
        </DialogHeader>

        {/* Search and Sort Controls */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alphabet">Alphabet</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scrollable Service List */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-4 min-h-[300px]">
          {sortBy === "category" && groupedServices ? (
            // Grouped by category with dividers
            Object.keys(groupedServices).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery.trim()
                    ? "No services found matching your search."
                    : "All available services are already connected."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedServices).map(
                  ([category, categoryServices], categoryIndex) => (
                    <div key={category}>
                      {categoryIndex > 0 && <Separator className="my-4" />}
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {category}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {categoryServices.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <img
                                src={service.icon}
                                alt={service.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 flex-shrink-0 rounded"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.src = "/globe.svg";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{service.name}</p>
                                <p className="text-xs text-muted-foreground uppercase">
                                  {service.category}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleConnect(service)}
                              className="ml-4 flex-shrink-0"
                            >
                              <Route className="h-4 w-4 mr-2" />
                              Connect
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )
          ) : flatServices ? (
            // Flat list sorted alphabetically
            flatServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery.trim()
                    ? "No services found matching your search."
                    : "All available services are already connected."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {flatServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={service.icon}
                        alt={service.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 flex-shrink-0 rounded"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = "/globe.svg";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{service.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {service.category}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleConnect(service)}
                      className="ml-4 flex-shrink-0"
                    >
                      <Route className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
