"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Check } from "lucide-react";

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  hasPublished?: boolean;
}

export default function PublishDialog({
  isOpen,
  onClose,
  onPublish,
  hasPublished = false,
}: PublishDialogProps) {
  const [subdomain, setSubdomain] = useState("myproject");
  const [isTaken, _setIsTaken] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validate subdomain on change
  useEffect(() => {
    // Taken subdomains for validation
    const takenDomains = ["myapp", "avi", "app"];
    const isValid = !takenDomains.includes(subdomain.toLowerCase());
    _setIsTaken(!isValid);
  }, [subdomain]);

  // Handle subdomain change
  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    // Limit length to prevent overly long subdomains
    const truncatedValue = value.substring(0, 50);
    setSubdomain(truncatedValue);
  };

  // Handle open URL
  const handleOpenURL = () => {
    const url = `https://${subdomain}.crunchycone.dev`;
    window.open(url, "_blank");
  };

  // Handle publish (combines save and publish)
  const handlePublish = () => {
    if (!isTaken && subdomain.trim()) {
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

      onPublish();
      // In a real app, this would trigger the actual publish process
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Enter") {
      handlePublish();
    }
  };

  if (!isOpen) return null;

  const _fullURL = `${subdomain}.crunchycone.dev`;
  const publishButtonText = hasPublished ? "Publish changes" : "Publish app";

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
        role="dialog"
        aria-labelledby="publish-dialog-title"
        aria-describedby="publish-dialog-description"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 id="publish-dialog-title" className="text-base sm:text-lg font-medium text-gray-900">
            {hasPublished ? "Publish changes" : "Publish your app"}
          </h3>
          <p id="publish-dialog-description" className="text-xs sm:text-sm text-gray-600 mt-1">
            Upload your app and set up your app url so you can share it with others
          </p>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* Website Address Section */}
          <div>
            <label
              className={`block text-xs sm:text-sm font-medium mb-2 ${
                isTaken ? "text-red-600" : "text-gray-700"
              }`}
            >
              {isTaken ? "Website address already taken" : "Website address"}
            </label>

            {/* Always in Edit Mode */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex w-full sm:flex-1">
                {/* Prefix */}
                <div className="inline-flex items-center px-2 sm:px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm rounded-l-md">
                  https://
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  className="flex-1 px-2 sm:px-3 py-2 border border-r-0 border-l-0 border-gray-300 focus:outline-none text-sm sm:text-base min-w-0"
                  placeholder="myproject"
                  autoFocus
                  aria-label="Website subdomain"
                  aria-describedby={isTaken ? "subdomain-error" : undefined}
                  aria-invalid={isTaken}
                  maxLength={50}
                />

                {/* Suffix */}
                <div className="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm rounded-r-md whitespace-nowrap">
                  .crunchycone.dev
                </div>
              </div>

              {/* Open URL Button - Positioned to the right */}
              <button
                onClick={handleOpenURL}
                disabled={isTaken}
                className={`p-2 rounded-md transition-colors flex-shrink-0 ${
                  isTaken
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                }`}
                title={
                  isTaken
                    ? "Cannot open - domain is taken"
                    : "Open your app's webaddress in a new tab"
                }
              >
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {showSuccess && (
              <div className="mt-2 flex items-center text-sm text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span>Website address updated and published!</span>
              </div>
            )}
          </div>

          {/* Publish Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handlePublish}
              disabled={isTaken || !subdomain.trim()}
              className="w-full px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            >
              {publishButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
