'use client';

import { useState, useEffect } from 'react';
import { Pencil, ExternalLink, Check } from 'lucide-react';
import SubdomainInput from '@/components/admin/SubdomainInput';
import { Button } from '@/components/admin-ui/button';

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  hasPublished?: boolean;
}

export default function PublishDialog({ isOpen, onClose, onPublish, hasPublished = false }: PublishDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [subdomain, setSubdomain] = useState('myproject');
  const [savedSubdomain, setSavedSubdomain] = useState('myproject');
  const [isTaken, setIsTaken] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Taken subdomains for validation
  const takenDomains = ['myapp', 'avi', 'app'];

  // Validate subdomain on change
  useEffect(() => {
    const isValid = !takenDomains.includes(subdomain.toLowerCase());
    setIsTaken(!isValid);
  }, [subdomain]);

  // Handle subdomain change
  const handleSubdomainChange = (value: string) => {
    setSubdomain(value);
  };

  // Handle save address
  const handleSaveAddress = () => {
    if (!isTaken && subdomain.trim()) {
      setSavedSubdomain(subdomain);
      setShowSuccess(true);
      setIsEditing(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  };

  // Handle open URL
  const handleOpenURL = () => {
    const url = `https://${savedSubdomain}.crunchycone.dev`;
    window.open(url, '_blank');
  };

  // Handle publish
  const handlePublish = () => {
    onPublish();
    // In a real app, this would trigger the actual publish process
  };

  if (!isOpen) return null;

  const fullURL = `${savedSubdomain}.crunchycone.dev`;
  const publishButtonText = hasPublished ? 'Publish changes' : 'Publish app';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {hasPublished ? 'Publish changes' : 'Publish your app'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload your app and set up your app url so you can share it with others
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Website Address Section */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isTaken ? 'text-red-600' : 'text-gray-700'
            }`}>
              {isTaken ? 'Website address already taken' : 'Website address'}
            </label>
            
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-3">
                <SubdomainInput
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  label=""
                  placeholder="myproject"
                  takenDomains={takenDomains}
                  showOpenButton={false}
                />
                
                <Button
                  onClick={handleSaveAddress}
                  disabled={isTaken || !subdomain.trim()}
                  size="sm"
                >
                  Save address
                </Button>
              </div>
            ) : (
              /* View Mode */
              <div className="flex items-center space-x-3">
                <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <span className="text-gray-900 font-mono">https://{fullURL}</span>
                </div>
                
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit address"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                
                <button
                  onClick={handleOpenURL}
                  disabled={isTaken}
                  className={`p-2 rounded-md transition-colors ${
                    isTaken 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title={isTaken ? 'Cannot open - domain is taken' : "Open your app's webaddress in a new tab"}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {showSuccess && (
              <div className="mt-2 flex items-center text-sm text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span>Website address updated</span>
              </div>
            )}
          </div>

          {/* Publish Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handlePublish}
              disabled={isEditing}
              className="w-full"
            >
              {publishButtonText}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
