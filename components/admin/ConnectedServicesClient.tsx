"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle } from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin-ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu";
import { Checkbox } from "@/components/admin-ui/checkbox";
import { Separator } from "@/components/admin-ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/admin-ui/tooltip";
import { Loader2, Save, Route, MoreVertical, HelpCircle } from "lucide-react";
import {
  SupportedService,
  updateServiceVariables,
  hasCrunchyConeConfig,
  getRemoteEnvironmentVariables,
} from "@/app/actions/connected-services";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/admin-ui/form";

interface ConnectedServicesClientProps {
  service: SupportedService;
  forceDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "failed";

function isServiceConnected(service: SupportedService): boolean {
  const requiredVars = service.variables.filter((v) => v.required);
  return requiredVars.length > 0 && requiredVars.every((v) => v.value && v.value.trim() !== "");
}

export function ConnectedServicesClient({
  service,
  forceDialogOpen,
  onDialogOpenChange,
}: ConnectedServicesClientProps) {
  const router = useRouter();
  const initialConnected = isServiceConnected(service);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    initialConnected ? "connected" : "idle"
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sync with external control
  const isDialogOpen = forceDialogOpen !== undefined ? forceDialogOpen : dialogOpen;
  const handleDialogOpenChange = (open: boolean) => {
    if (forceDialogOpen === undefined) {
      setDialogOpen(open);
    }
    onDialogOpenChange?.(open);
  };
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Remote sync state
  const [hasCrunchyCone, setHasCrunchyCone] = useState(false);
  const [syncToRemote, setSyncToRemote] = useState(true);
  const [_remoteValues, setRemoteValues] = useState<Record<string, string>>({});

  // Determine if service is currently connected (considering connection status)
  const connected = connectionStatus === "connected";

  // Initialize form with react-hook-form
  const form = useForm<Record<string, string>>({
    defaultValues: (() => {
      const initial: Record<string, string> = {};
      service.variables.forEach((variable) => {
        initial[variable.id] = variable.value || "";
      });
      return initial;
    })(),
  });

  // Check for CrunchyCone config and fetch remote values when dialog opens
  useEffect(() => {
    if (!isDialogOpen) return;

    const loadRemoteData = async () => {
      // Check if crunchycone.toml exists
      const hasConfig = await hasCrunchyConeConfig();
      setHasCrunchyCone(hasConfig);

      if (!hasConfig) {
        setSyncToRemote(false);
        return;
      }

      // Get the variable names (without service prefix)
      const varNames = service.variables.map((v) => v.id.replace(`${service.id}_`, ""));

      // Fetch remote values
      const remoteVars = await getRemoteEnvironmentVariables(varNames);
      setRemoteValues(remoteVars);

      // Compare local vs remote to determine initial checkbox state
      let allMatch = true;
      for (const variable of service.variables) {
        const varName = variable.id.replace(`${service.id}_`, "");
        const localValue = variable.value || "";
        const remoteValue = remoteVars[varName] || "";

        if (localValue !== remoteValue) {
          allMatch = false;
          break;
        }
      }

      // Set initial checkbox state based on whether values match
      setSyncToRemote(allMatch);

      // If values don't match, populate remote fields
      if (!allMatch) {
        const formData: Record<string, string> = {};
        service.variables.forEach((variable) => {
          const varName = variable.id.replace(`${service.id}_`, "");
          formData[variable.id] = variable.value || "";
          formData[`${variable.id}_remote`] = remoteVars[varName] || "";
        });
        form.reset(formData);
      }
    };

    loadRemoteData();
  }, [isDialogOpen, service.id, service.variables, form]);

  const handleSave = async (data: Record<string, string>) => {
    setIsSaving(true);

    try {
      // Collect local variables
      const variablesToUpdate = service.variables.map((variable) => ({
        id: variable.id,
        value: data[variable.id] || "",
      }));

      // Prepare remote variables if checkbox is unchecked
      let remoteVariables: Array<{ id: string; value: string }> | undefined;
      if (hasCrunchyCone && !syncToRemote) {
        remoteVariables = service.variables.map((variable) => ({
          id: `${variable.id}_remote`,
          value: data[`${variable.id}_remote`] || "",
        }));
      }

      // Call server action with sync options
      const result = await updateServiceVariables(service.id, variablesToUpdate, {
        syncToRemote: hasCrunchyCone && syncToRemote,
        remoteVariables,
      });

      if (result.success) {
        setConnectionStatus("connected");
        toast({
          title: "Success",
          description: `${service.name} has been configured successfully.`,
        });
        // Refresh to get updated data
        router.refresh();
        // Close the dialog
        handleDialogOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save changes",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSaving(true);
    setConnectionStatus("connecting");

    try {
      // Clear all variable values
      const variablesToUpdate = service.variables.map((variable) => ({
        id: variable.id,
        value: "",
      }));

      // Check if CrunchyCone is configured
      const hasConfig = await hasCrunchyConeConfig();

      // If CrunchyCone is configured, also clear remote values
      const result = await updateServiceVariables(service.id, variablesToUpdate, {
        syncToRemote: hasConfig, // Clear remote as well if configured
      });

      if (result.success) {
        setConnectionStatus("idle");
        toast({
          title: "Disconnected",
          description: `${service.name} has been disconnected.`,
        });
        router.refresh();
      } else {
        setConnectionStatus("failed");
        toast({
          title: "Error",
          description: result.error || "Failed to disconnect",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus("failed");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogClose = () => {
    if (!isSaving) {
      // Reset form to original values when closing
      const original: Record<string, string> = {};
      service.variables.forEach((variable) => {
        original[variable.id] = variable.value || "";
      });
      form.reset(original);
      handleDialogOpenChange(false);
    }
  };

  const handleSyncToggle = (checked: boolean) => {
    setSyncToRemote(checked);

    if (!checked) {
      // Unchecking - copy current local values to both local and remote fields
      const currentData = form.getValues();
      const newData: Record<string, string> = {};

      service.variables.forEach((variable) => {
        const currentValue = currentData[variable.id] || "";
        newData[variable.id] = currentValue;
        newData[`${variable.id}_remote`] = currentValue;
      });

      form.reset(newData, { keepDirty: true });
    }
    // When checking, just keep the local values (remote will sync on save)
  };

  const hasChanges = form.formState.isDirty;
  const isLoading = connectionStatus === "connecting" || isSaving;

  const handleCardClick = () => {
    if (!isLoading) {
      handleDialogOpenChange(true);
    }
  };

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleCardClick}
      >
        <CardHeader className="p-0 pl-[10px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <img
                src={service.icon}
                alt={service.name}
                width={24}
                height={24}
                className="w-6 h-6 flex-shrink-0"
                onError={(e) => {
                  // Fallback to a default icon if image fails to load
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = "/globe.svg";
                }}
              />
              <CardTitle className="text-sm font-semibold">{service.name}</CardTitle>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDialogOpenChange(true)}
                    disabled={isLoading}
                  >
                    Change Keys
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDisconnect} disabled={isLoading}>
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{service.name}</DialogTitle>
            <DialogDescription>
              {connected
                ? "Update your service configuration"
                : "Configure your service connection"}
            </DialogDescription>
          </DialogHeader>

          {/* Sync Checkbox - only show if CrunchyCone config exists */}
          {hasCrunchyCone && (
            <div className="flex items-center gap-2 py-2">
              <Checkbox
                id="sync-to-remote"
                checked={syncToRemote}
                onCheckedChange={handleSyncToggle}
                disabled={isSaving}
              />
              <label
                htmlFor="sync-to-remote"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
              >
                Use same settings in my published website
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center"
                        onClick={(e) => e.preventDefault()}
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        When checked, the same configuration will be used locally and in production.
                        Uncheck this if you need different settings (e.g., separate API keys for
                        development vs production)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              {!hasCrunchyCone || syncToRemote ? (
                // Single field set when no CrunchyCone config OR checkbox is checked
                <>
                  {service.variables.map((variable) => (
                    <FormField
                      key={variable.id}
                      control={form.control}
                      name={variable.id}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            {variable.friendlyName}
                            {variable.required ? " *" : ""}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type={variable.sensitive ? "password" : "text"}
                              {...field}
                              placeholder={`Enter ${variable.friendlyName.toLowerCase()}`}
                              className="font-mono text-sm"
                              disabled={isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </>
              ) : (
                // Dual field sets when CrunchyCone config exists AND checkbox is unchecked
                <>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground">Local Development</h4>
                    {service.variables.map((variable) => (
                      <FormField
                        key={variable.id}
                        control={form.control}
                        name={variable.id}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              {variable.friendlyName}
                              {variable.required ? " *" : ""}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type={variable.sensitive ? "password" : "text"}
                                {...field}
                                placeholder={`Enter ${variable.friendlyName.toLowerCase()}`}
                                className="font-mono text-sm"
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground">Published Website</h4>
                    {service.variables.map((variable) => (
                      <FormField
                        key={`${variable.id}_remote`}
                        control={form.control}
                        name={`${variable.id}_remote`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              {variable.friendlyName}
                              {variable.required ? " *" : ""}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type={variable.sensitive ? "password" : "text"}
                                {...field}
                                placeholder={`Enter ${variable.friendlyName.toLowerCase()}`}
                                className="font-mono text-sm"
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" disabled={isSaving || !hasChanges}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {connected ? "Saving..." : "Connecting..."}
                    </>
                  ) : (
                    <>
                      {connected ? (
                        <Save className="h-4 w-4 mr-2" />
                      ) : (
                        <Route className="h-4 w-4 mr-2" />
                      )}
                      {connected ? "Save Changes" : "Connect"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
