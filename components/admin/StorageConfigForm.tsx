"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Label } from "@/components/admin-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin-ui/select";
import { Alert, AlertDescription } from "@/components/admin-ui/alert";
import { Tabs, TabsContent } from "@/components/admin-ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin-ui/dialog";
import { Loader2, Plug, Save, HelpCircle } from "lucide-react";
import {
  getStorageSettings,
  updateStorageSettings,
  testStorageConnection,
  getConfiguredStorageProviders,
} from "@/app/actions/storage-settings";
import { logger } from "@/lib/logger";

interface StorageSettings {
  provider: string;
  // LocalStorage settings
  localStoragePath?: string;
  localStorageBaseUrl?: string;

  // AWS S3 settings
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  awsBucket?: string;
  awsCloudFrontDomain?: string;

  // Digital Ocean Spaces settings
  doAccessKeyId?: string;
  doSecretAccessKey?: string;
  doRegion?: string;
  doBucket?: string;
  doCdnEndpoint?: string;

  // Azure Storage settings
  azureAccountName?: string;
  azureAccountKey?: string;
  azureSasToken?: string;
  azureConnectionString?: string;
  azureContainerName?: string;
  azureCdnUrl?: string;

  // Google Cloud Storage settings
  gcpProjectId?: string;
  gcpKeyFile?: string;
  gcsBucket?: string;
  gcpCdnUrl?: string;

  // Wasabi settings
  wasabiAccessKey?: string;
  wasabiSecretKey?: string;
  wasabiRegion?: string;
  wasabiBucket?: string;

  // Cloudflare R2 settings
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2AccountId?: string;
  r2Bucket?: string;
  r2PublicDomain?: string;

  // Backblaze B2 settings
  backblazeKeyId?: string;
  backblazeApplicationKey?: string;
  backblazeRegion?: string;
  backblazeBucket?: string;
}

export function StorageConfigForm() {
  const [settings, setSettings] = useState<StorageSettings>({
    provider: "localstorage",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    details?: string;
    error?: string;
  } | null>(null);
  const [_isPlatformMode, setIsPlatformMode] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);

  // Load current settings and check platform mode
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settingsResult, providersResult] = await Promise.all([
          getStorageSettings(),
          getConfiguredStorageProviders(),
        ]);

        if (settingsResult.success && settingsResult.settings) {
          setSettings(settingsResult.settings);
          // Use platform mode info from settings instead of separate API call
          setIsPlatformMode(settingsResult.isPlatformMode || false);
        } else {
          setMessage({
            type: "error",
            text: settingsResult.error || "Failed to load storage settings",
          });
        }

        if (providersResult.success && providersResult.providerIds) {
          setConfiguredProviders(providersResult.providerIds);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load storage settings" });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateStorageSettings(settings);
      if (result.success) {
        setMessage({ type: "success", text: "Storage settings updated successfully" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update storage settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update storage settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testStorageConnection(settings);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Get instructions for setting up storage providers
  const getProviderInstructions = () => {
    switch (settings.provider) {
      case "aws":
        return {
          title: "How to Set Up AWS S3 Storage",
          steps: [
            {
              title: "Create AWS Account",
              content: "Sign up for AWS if you don't have an account.",
            },
            {
              title: "Create IAM User",
              content: "Go to AWS IAM console and create a new user for programmatic access.",
            },
            {
              title: "Attach S3 Policy",
              content:
                "Attach the 'AmazonS3FullAccess' policy or create a custom policy with S3 permissions.",
            },
            {
              title: "Generate Access Keys",
              content:
                "Create access keys for the IAM user. Download and securely store the Access Key ID and Secret Access Key.",
            },
            {
              title: "Create S3 Bucket",
              content: "Go to S3 console and create a new bucket in your preferred region.",
            },
            {
              title: "Configure Bucket",
              content: "Set appropriate permissions and enable/disable public access as needed.",
            },
            {
              title: "Optional: CloudFront",
              content: "For CDN, create a CloudFront distribution pointing to your S3 bucket.",
            },
          ],
          link: "https://aws.amazon.com",
        };
      case "digitalocean":
        return {
          title: "How to Set Up DigitalOcean Spaces Storage",
          steps: [
            {
              title: "Create DigitalOcean Account",
              content: "Sign up for DigitalOcean if you don't have an account.",
            },
            {
              title: "Create Spaces",
              content: "Go to Spaces in the DigitalOcean control panel and create a new Space.",
            },
            {
              title: "Choose Region",
              content: "Select a region close to your users for better performance.",
            },
            {
              title: "Generate API Keys",
              content: "Go to API → Spaces Keys and generate new credentials.",
            },
            { title: "Get Access Keys", content: "Copy the Access Key ID and Secret Access Key." },
            {
              title: "Note Space Details",
              content: "Record your Space name and region for configuration.",
            },
            {
              title: "Optional: CDN",
              content: "Enable CDN for your Space to get a CDN endpoint URL.",
            },
          ],
          link: "https://cloud.digitalocean.com/spaces",
        };
      case "azure":
        return {
          title: "How to Set Up Azure Blob Storage",
          steps: [
            {
              title: "Create Azure Account",
              content: "Sign up for Azure if you don't have an account.",
            },
            {
              title: "Create Storage Account",
              content: "In Azure Portal, create a new Storage Account.",
            },
            {
              title: "Choose Settings",
              content: "Select performance tier (Standard/Premium) and replication options.",
            },
            {
              title: "Create Container",
              content: "In your storage account, create a new Blob container.",
            },
            {
              title: "Get Access Keys",
              content:
                "Go to Access Keys section and copy one of the connection strings or account keys.",
            },
            {
              title: "Optional: SAS Token",
              content:
                "For more granular access, generate a SAS token instead of using account keys.",
            },
            {
              title: "Optional: CDN",
              content: "Enable Azure CDN for your storage account to get a CDN URL.",
            },
          ],
          link: "https://portal.azure.com",
        };
      case "gcp":
        return {
          title: "How to Set Up Google Cloud Storage",
          steps: [
            {
              title: "Create GCP Account",
              content: "Sign up for Google Cloud if you don't have an account.",
            },
            {
              title: "Create Project",
              content: "Create a new project in Google Cloud Console or select an existing one.",
            },
            {
              title: "Enable Cloud Storage API",
              content:
                "Go to APIs & Services and enable the Google Cloud Storage API for your project.",
            },
            {
              title: "Create Service Account",
              content: "Go to IAM & Admin → Service Accounts and create a new service account.",
            },
            {
              title: "Generate Key File",
              content:
                "Create and download a JSON key file for the service account. Store this securely.",
            },
            {
              title: "Set Permissions",
              content: "Grant the service account 'Storage Admin' or custom storage permissions.",
            },
            {
              title: "Create Storage Bucket",
              content: "Go to Cloud Storage and create a new bucket in your preferred region.",
            },
            {
              title: "Configure Access",
              content: "Set appropriate bucket permissions and access controls as needed.",
            },
            {
              title: "Optional: CDN",
              content: "Set up Cloud CDN or use a custom CDN URL for faster content delivery.",
            },
          ],
          link: "https://console.cloud.google.com",
        };
      case "wasabi":
        return {
          title: "How to Set Up Wasabi Storage",
          steps: [
            {
              title: "Create Wasabi Account",
              content: "Sign up for Wasabi if you don't have an account.",
            },
            {
              title: "Create Access Keys",
              content: "Go to Access Keys in your Wasabi console and create a new access key pair.",
            },
            {
              title: "Copy Credentials",
              content: "Save your Access Key and Secret Key securely.",
            },
            {
              title: "Create Bucket",
              content: "Create a new bucket in your desired region.",
            },
            {
              title: "Note Region",
              content: "Record the region code (e.g., us-east-1, eu-central-1) for your bucket.",
            },
          ],
          link: "https://wasabi.com",
        };
      case "r2":
        return {
          title: "How to Set Up Cloudflare R2 Storage",
          steps: [
            {
              title: "Create Cloudflare Account",
              content: "Sign up for Cloudflare if you don't have an account.",
            },
            {
              title: "Enable R2",
              content: "Navigate to R2 in your Cloudflare dashboard and enable the service.",
            },
            {
              title: "Create R2 Bucket",
              content: "Create a new R2 bucket with your preferred name.",
            },
            {
              title: "Generate API Token",
              content:
                "Go to R2 API Tokens and create a new API token with read/write permissions.",
            },
            {
              title: "Copy Credentials",
              content: "Save your Access Key ID and Secret Access Key, along with your Account ID.",
            },
            {
              title: "Optional: Public Domain",
              content:
                "If you want to serve files publicly, configure a custom domain for your bucket.",
            },
          ],
          link: "https://dash.cloudflare.com",
        };
      case "backblaze":
        return {
          title: "How to Set Up Backblaze B2 Storage",
          steps: [
            {
              title: "Create Backblaze Account",
              content: "Sign up for Backblaze B2 if you don't have an account.",
            },
            {
              title: "Create Bucket",
              content: "Create a new B2 bucket with appropriate permissions.",
            },
            {
              title: "Generate Application Key",
              content:
                "Go to App Keys and create a new application key with read/write permissions.",
            },
            {
              title: "Copy Credentials",
              content:
                "Save your Application Key ID and Application Key securely. These cannot be retrieved later.",
            },
            {
              title: "Note Region",
              content: "Record the region/endpoint for your bucket (e.g., us-west-001).",
            },
            {
              title: "Note Bucket Name",
              content: "Keep track of your bucket name for configuration.",
            },
          ],
          link: "https://www.backblaze.com/b2/cloud-storage.html",
        };
      default:
        return null;
    }
  };

  // Render help dialog for storage providers
  const renderProviderHelp = () => {
    const instructions = getProviderInstructions();
    if (!instructions) return null;

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-1">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{instructions.title}</DialogTitle>
            <DialogDescription>
              Follow these steps to get your storage credentials for {settings.provider}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-3">
              {instructions.steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <h5 className="font-semibold">
                    {index + 1}. {step.title}
                  </h5>
                  <p>{step.content}</p>
                </div>
              ))}
            </div>
            {instructions.link && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">Get started:</p>
                <p>
                  Visit{" "}
                  <a
                    href={instructions.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {instructions.link}
                  </a>{" "}
                  to begin the setup process.
                </p>
              </div>
            )}
            <Alert>
              <AlertDescription>
                <strong>Security Note:</strong> Store your credentials securely and never share them
                publicly. Use environment variables or secure credential management systems in
                production.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading storage settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-[600px]">
          {/* Storage Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Storage Provider</Label>
            <Select
              value={settings.provider}
              onValueChange={(value) => {
                // Clear any existing error/success messages and test results when provider changes
                setMessage(null);
                setTestResult(null);
                setSettings((prev) => ({ ...prev, provider: value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select storage provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="localstorage">Crunchycone storage</SelectItem>
                <SelectItem value="aws">
                  AWS S3{configuredProviders.includes("aws") ? " (Connected)" : ""}
                </SelectItem>
                <SelectItem value="digitalocean">
                  DigitalOcean Spaces
                  {configuredProviders.includes("digitalocean") ? " (Connected)" : ""}
                </SelectItem>
                <SelectItem value="azure">
                  Azure Blob Storage{configuredProviders.includes("azure") ? " (Connected)" : ""}
                </SelectItem>
                <SelectItem value="gcp">
                  Google Cloud Storage{configuredProviders.includes("gcp") ? " (Connected)" : ""}
                </SelectItem>
                <SelectItem value="wasabi">
                  Wasabi{configuredProviders.includes("wasabi") ? " (Connected)" : ""}
                </SelectItem>
                <SelectItem value="r2">
                  Cloudflare R2{configuredProviders.includes("r2") ? " (Connected)" : ""}
                </SelectItem>
                <SelectItem value="backblaze">
                  Backblaze B2{configuredProviders.includes("backblaze") ? " (Connected)" : ""}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Provider-Specific Configuration */}
          {settings.provider !== "localstorage" && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">Provider Configuration</h3>
                  {renderProviderHelp()}
                </div>
              </div>

              <Tabs value={settings.provider} className="w-full">
                {/* AWS S3 Configuration */}
                <TabsContent value="aws" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="awsAccessKeyId">Access Key ID</Label>
                      <Input
                        id="awsAccessKeyId"
                        type="text"
                        placeholder="AKIA..."
                        value={settings.awsAccessKeyId || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, awsAccessKeyId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="awsSecretAccessKey">Secret Access Key</Label>
                      <Input
                        id="awsSecretAccessKey"
                        type="password"
                        placeholder="Your AWS secret key"
                        value={settings.awsSecretAccessKey || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, awsSecretAccessKey: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="awsRegion">Region</Label>
                      <Input
                        id="awsRegion"
                        type="text"
                        placeholder="us-east-1"
                        value={settings.awsRegion || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, awsRegion: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="awsBucket">Bucket Name</Label>
                      <Input
                        id="awsBucket"
                        type="text"
                        placeholder="my-s3-bucket"
                        value={settings.awsBucket || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, awsBucket: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="awsCloudFrontDomain">CloudFront Domain (Optional)</Label>
                      <Input
                        id="awsCloudFrontDomain"
                        type="text"
                        placeholder="d123456789.cloudfront.net"
                        value={settings.awsCloudFrontDomain || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, awsCloudFrontDomain: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* DigitalOcean Spaces Configuration */}
                <TabsContent value="digitalocean" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="doAccessKeyId">Access Key ID</Label>
                      <Input
                        id="doAccessKeyId"
                        type="text"
                        placeholder="Your DO access key"
                        value={settings.doAccessKeyId || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, doAccessKeyId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doSecretAccessKey">Secret Access Key</Label>
                      <Input
                        id="doSecretAccessKey"
                        type="password"
                        placeholder="Your DO secret key"
                        value={settings.doSecretAccessKey || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, doSecretAccessKey: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doRegion">Region</Label>
                      <Input
                        id="doRegion"
                        type="text"
                        placeholder="nyc3"
                        value={settings.doRegion || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, doRegion: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doBucket">Space Name</Label>
                      <Input
                        id="doBucket"
                        type="text"
                        placeholder="my-space"
                        value={settings.doBucket || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, doBucket: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="doCdnEndpoint">CDN Endpoint (Optional)</Label>
                      <Input
                        id="doCdnEndpoint"
                        type="text"
                        placeholder="my-space.nyc3.cdn.digitaloceanspaces.com"
                        value={settings.doCdnEndpoint || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, doCdnEndpoint: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Azure Storage Configuration */}
                <TabsContent value="azure" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="azureAccountName">Account Name</Label>
                      <Input
                        id="azureAccountName"
                        type="text"
                        placeholder="mystorageaccount"
                        value={settings.azureAccountName || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, azureAccountName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="azureAccountKey">Account Key</Label>
                      <Input
                        id="azureAccountKey"
                        type="password"
                        placeholder="Your Azure account key"
                        value={settings.azureAccountKey || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, azureAccountKey: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="azureContainerName">Container Name</Label>
                      <Input
                        id="azureContainerName"
                        type="text"
                        placeholder="my-container"
                        value={settings.azureContainerName || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, azureContainerName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="azureSasToken">SAS Token (Optional)</Label>
                      <Input
                        id="azureSasToken"
                        type="password"
                        placeholder="SAS token"
                        value={settings.azureSasToken || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, azureSasToken: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="azureConnectionString">
                        Connection String (Alternative to Account Key)
                      </Label>
                      <Input
                        id="azureConnectionString"
                        type="password"
                        placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                        value={settings.azureConnectionString || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            azureConnectionString: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="azureCdnUrl">CDN URL (Optional)</Label>
                      <Input
                        id="azureCdnUrl"
                        type="text"
                        placeholder="https://mycdn.azureedge.net"
                        value={settings.azureCdnUrl || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, azureCdnUrl: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Google Cloud Storage Configuration */}
                <TabsContent value="gcp" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gcpProjectId">Project ID</Label>
                      <Input
                        id="gcpProjectId"
                        type="text"
                        placeholder="my-gcp-project"
                        value={settings.gcpProjectId || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, gcpProjectId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gcpKeyFile">Service Account Key File Path</Label>
                      <Input
                        id="gcpKeyFile"
                        type="text"
                        placeholder="/path/to/service-account.json"
                        value={settings.gcpKeyFile || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, gcpKeyFile: e.target.value }))
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Optional if using other GCP authentication methods
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gcsBucket">Bucket Name</Label>
                      <Input
                        id="gcsBucket"
                        type="text"
                        placeholder="my-gcs-bucket"
                        value={settings.gcsBucket || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, gcsBucket: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gcpCdnUrl">CDN URL (Optional)</Label>
                      <Input
                        id="gcpCdnUrl"
                        type="text"
                        placeholder="https://cdn.example.com"
                        value={settings.gcpCdnUrl || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, gcpCdnUrl: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Wasabi Configuration */}
                <TabsContent value="wasabi" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wasabiAccessKey">Access Key</Label>
                      <Input
                        id="wasabiAccessKey"
                        type="password"
                        placeholder="Your Wasabi access key"
                        value={settings.wasabiAccessKey || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, wasabiAccessKey: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wasabiSecretKey">Secret Key</Label>
                      <Input
                        id="wasabiSecretKey"
                        type="password"
                        placeholder="Your Wasabi secret key"
                        value={settings.wasabiSecretKey || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, wasabiSecretKey: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wasabiRegion">Region</Label>
                      <Input
                        id="wasabiRegion"
                        type="text"
                        placeholder="us-east-1"
                        value={settings.wasabiRegion || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, wasabiRegion: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wasabiBucket">Bucket Name</Label>
                      <Input
                        id="wasabiBucket"
                        type="text"
                        placeholder="my-wasabi-bucket"
                        value={settings.wasabiBucket || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, wasabiBucket: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Cloudflare R2 Configuration */}
                <TabsContent value="r2" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="r2AccessKeyId">Access Key ID</Label>
                      <Input
                        id="r2AccessKeyId"
                        type="password"
                        placeholder="Your R2 access key ID"
                        value={settings.r2AccessKeyId || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, r2AccessKeyId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r2SecretAccessKey">Secret Access Key</Label>
                      <Input
                        id="r2SecretAccessKey"
                        type="password"
                        placeholder="Your R2 secret access key"
                        value={settings.r2SecretAccessKey || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, r2SecretAccessKey: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r2AccountId">Account ID</Label>
                      <Input
                        id="r2AccountId"
                        type="text"
                        placeholder="Your Cloudflare account ID"
                        value={settings.r2AccountId || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, r2AccountId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r2Bucket">Bucket Name</Label>
                      <Input
                        id="r2Bucket"
                        type="text"
                        placeholder="my-r2-bucket"
                        value={settings.r2Bucket || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, r2Bucket: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="r2PublicDomain">Public Domain (Optional)</Label>
                      <Input
                        id="r2PublicDomain"
                        type="text"
                        placeholder="https://cdn.example.com"
                        value={settings.r2PublicDomain || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, r2PublicDomain: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Backblaze B2 Configuration */}
                <TabsContent value="backblaze" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backblazeKeyId">Application Key ID</Label>
                      <Input
                        id="backblazeKeyId"
                        type="password"
                        placeholder="Your application key ID"
                        value={settings.backblazeKeyId || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, backblazeKeyId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backblazeApplicationKey">Application Key</Label>
                      <Input
                        id="backblazeApplicationKey"
                        type="password"
                        placeholder="Your application key"
                        value={settings.backblazeApplicationKey || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            backblazeApplicationKey: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backblazeRegion">Region</Label>
                      <Input
                        id="backblazeRegion"
                        type="text"
                        placeholder="us-west-001"
                        value={settings.backblazeRegion || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, backblazeRegion: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backblazeBucket">Bucket Name</Label>
                      <Input
                        id="backblazeBucket"
                        type="text"
                        placeholder="my-b2-bucket"
                        value={settings.backblazeBucket || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, backblazeBucket: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* All Alerts and Messages - Positioned above Action Buttons */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-1">
                  <p>{testResult.success ? "Connection successful!" : testResult.error}</p>
                  {testResult.details && <p className="text-sm opacity-80">{testResult.details}</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {settings.provider === "localstorage" && (
            <Alert variant="default">
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium text-base">
                    CrunchyCone handles your file storage automatically
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">During development:</span> Files are stored
                      locally in the{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">./uploads</code> folder
                      and accessed via{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        /api/storage/files
                      </code>{" "}
                      URLs.
                    </p>
                    <p>
                      <span className="font-medium">After publishing:</span> CrunchyCone
                      automatically provisions cloud storage for your app.
                    </p>
                    <p>
                      <span className="font-medium">Note:</span> Local files don&apos;t
                      automatically sync to cloud storage. You can manually upload files from your
                      local media library to the cloud if needed.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {settings.provider !== "localstorage" && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-start">
              {/* Show test connection button for all providers except localstorage */}
              {settings.provider !== "localstorage" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="sm:w-auto"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Plug className="mr-1 h-4 w-4" />
                      Test connection
                    </>
                  )}
                </Button>
              )}

              <Button type="submit" disabled={isSaving} className="sm:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1 h-4 w-4" />
                    Save settings
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
