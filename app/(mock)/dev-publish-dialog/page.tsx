'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import SubdomainInput from '@/components/admin/SubdomainInput';
import { Button } from '@/components/admin-ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { logger } from '@/lib/logger';

// Force dynamic rendering for search params
export const dynamic = 'force-dynamic';

export default function DevPublishDialogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get published state from URL parameter, default to false
  const hasPublished = searchParams?.get('published') === 'true';

  const [subdomain, setSubdomain] = useState('myproject');
  const [isTaken, setIsTaken] = useState(false);

  // Website details states
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appLogo, setAppLogo] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  
  // Upload states
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);

  // Taken subdomains for validation
  const takenDomains = ['myapp', 'avi', 'app'];

  // Validate subdomain on change
  useEffect(() => {
    const isValid = !takenDomains.includes(subdomain.toLowerCase());
    setIsTaken(!isValid);
  }, [subdomain]);

  // Upload functions
  const uploadFile = async (file: File, type: 'logo' | 'preview'): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visibility", "public"); // Ensure files are public
    formData.append("folder", "website-assets"); // Organize in a specific folder

    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return result.url || null;
      } else {
        logger.error("Upload failed", { error: result.error });
        return null;
      }
    } catch (error) {
      logger.error("Upload error", {}, error instanceof Error ? error : undefined);
      return null;
    }
  };

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    setIsUploadingLogo(true);
    setAppLogo(file);

    const url = await uploadFile(file, 'logo');
    if (url) {
      setAppLogoUrl(url);
    }

    setIsUploadingLogo(false);
    return url;
  };

  const handlePreviewUpload = async (file: File): Promise<string | null> => {
    setIsUploadingPreview(true);
    setPreviewImage(file);

    const url = await uploadFile(file, 'preview');
    if (url) {
      setPreviewImageUrl(url);
    }

    setIsUploadingPreview(false);
    return url;
  };

  const removeLogo = () => {
    setAppLogo(null);
    setAppLogoUrl(null);
  };

  const removePreview = () => {
    setPreviewImage(null);
    setPreviewImageUrl(null);
  };

  // Handle publish
  const handlePublish = () => {
    if (!isTaken && subdomain.trim()) {
      // Navigate to progress page - outcome will be randomly determined there
      router.push(`/dev-build-progress?subdomain=${subdomain}`);
    }
  };

  const publishButtonText = hasPublished ? 'Publish changes' : 'Publish app';

  return (
    <div className="w-full max-w-lg min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {hasPublished ? 'Publish changes' : 'Publish your app'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your app and set up your app url so you can share it with others
          </p>
        </div>

        <div className="space-y-6">
          {/* Subdomain Input */}
          <SubdomainInput
            value={subdomain}
            onChange={setSubdomain}
            label="Website address"
            placeholder="myproject"
            takenDomains={takenDomains}
          />

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-6 mb-6"></div>

          {/* Website Details Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Website Details</h3>
            
            <div className="space-y-6">
              {/* App Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  App Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="My Awesome App"
                />
              </div>

              {/* App Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  App Description
                </label>
                <textarea
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="A brief description of your app"
                />
              </div>

              {/* App Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  App Logo
                </label>
                <FileUpload
                  onUpload={handleLogoUpload}
                  onRemove={removeLogo}
                  currentUrl={appLogoUrl}
                  isUploading={isUploadingLogo}
                  accept="image/*"
                  maxSize={5}
                  placeholder="Upload your app logo"
                />
              </div>

              {/* Preview Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview Image
                </label>
                <FileUpload
                  onUpload={handlePreviewUpload}
                  onRemove={removePreview}
                  currentUrl={previewImageUrl}
                  isUploading={isUploadingPreview}
                  accept="image/*"
                  maxSize={10}
                  placeholder="Upload a preview image for your website"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handlePublish}
            disabled={isTaken || !subdomain.trim()}
            className="w-full"
          >
            {publishButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
