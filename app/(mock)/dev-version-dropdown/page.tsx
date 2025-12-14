"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, ExternalLink, Clock, Hash, Server } from "lucide-react";
import { logger } from "@/lib/logger";

export default function DevVersionDropdownPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchVersions();
    
    // Ensure iframe is properly sized
    if (window.parent && window.parent !== window) {
      // Notify parent that iframe content is ready
      window.parent.postMessage({
        type: 'IFRAME_CONTENT_READY',
        source: 'version-selector'
      }, window.location.origin);
    }
  }, []);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/versions/list');
      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }
      const data = await response.json();
      setVersions(data.versions);
      setCurrentVersion(data.currentVersion);
    } catch (error) {
      logger.error('Error fetching versions', {}, error instanceof Error ? error : undefined);
      setError('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = async (version: any) => {
    try {
      // Since version switching is disabled, just show a message
      alert(`Version ${version.versionNumber} selection is disabled. Version switching functionality has been removed.`);
      
      // Close dialog by sending message to parent
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'VERSION_DIALOG_CLOSE'
        }, window.location.origin);
      }
    } catch (error) {
      logger.error('Error selecting version', {}, error instanceof Error ? error : undefined);
      alert('Error selecting version. Please try again.');
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2 text-gray-600">
            <GitBranch className="h-5 w-5 animate-spin" />
            <span>Loading versions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading versions</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white h-full overflow-hidden flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Version History</h2>
        <p className="text-sm text-gray-600 mb-4">
          View version history. Version switching functionality has been disabled.
        </p>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {versions.map((version, index) => (
          <Card 
            key={version.hash}
            className="cursor-pointer transition-all hover:shadow-md hover:border-blue-300 border-gray-200"
            onClick={() => handleVersionSelect(version)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Version #{version.versionNumber}
                    </h3>
                    {version.versionNumber === currentVersion && (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        Current
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">
                    {truncateMessage(version.message)}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <span className="font-mono">{version.hash}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Port {version.port}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Server className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-500">Disabled</span>
                    </div>
                  </div>
                </div>
                
                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex-shrink-0">
        <p className="text-xs text-gray-500 text-center">
          Version switching functionality has been disabled. This is view-only.
        </p>
      </div>
    </div>
  );
}