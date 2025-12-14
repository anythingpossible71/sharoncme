'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/admin-ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Rocket, Eye, Calendar, Code } from 'lucide-react';
import { MockBreadcrumb } from '@/components/admin/MockBreadcrumb';
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

// Mock backup data - reordered with current as 3rd and 2 newer versions above
const mockBackups = [
  {
    id: 'backup-001',
    title: 'Homepage v2.3',
    description: 'Latest mobile optimization with improved touch interactions and faster loading times',
    createdAt: '2024-01-17T14:20:00Z',
    environment: 'Production',
    viewport: 'Mobile',
    theme: 'Light',
    size: '375x667',
    isCurrent: false,
    isDraft: true,
  },
  {
    id: 'backup-002', 
    title: 'Dashboard Analytics v1.2',
    description: 'Enhanced analytics dashboard with real-time data visualization and export functionality',
    createdAt: '2024-01-16T11:15:00Z',
    environment: 'Staging',
    viewport: 'Desktop',
    theme: 'Dark',
    size: '1920x1080',
    isCurrent: false,
    isDraft: false,
  },
  {
    id: 'backup-003',
    title: 'Homepage v2.1',
    description: 'Updated hero section with new CTA buttons and improved mobile responsiveness',
    createdAt: '2024-01-15T10:30:00Z',
    environment: 'Production',
    viewport: 'Desktop',
    theme: 'Light',
    size: '1920x1080',
    isCurrent: true,
    isDraft: false,
  },
  {
    id: 'backup-004',
    title: 'Settings Page Redesign',
    description: 'Complete redesign of user settings with improved accessibility and new features',
    createdAt: '2024-01-12T14:15:00Z',
    environment: 'Production',
    viewport: 'Desktop',
    theme: 'Dark',
    size: '1920x1080',
    isCurrent: false,
    isDraft: false,
  },
  {
    id: 'backup-005',
    title: 'Mobile Checkout Flow',
    description: 'Streamlined mobile checkout process with better form validation and payment options',
    createdAt: '2024-01-13T09:20:00Z',
    environment: 'Preview',
    viewport: 'Mobile',
    theme: 'Light',
    size: '375x667',
    isCurrent: false,
    isDraft: false,
  },
  {
    id: 'backup-006',
    title: 'Admin Panel v1.8',
    description: 'Updated admin interface with new user management features and improved navigation',
    createdAt: '2024-01-10T16:30:00Z',
    environment: 'Production',
    viewport: 'Desktop',
    theme: 'Light',
    size: '1920x1080',
    isCurrent: false,
    isDraft: false,
  },
];

export default function EmbededVersionsPage() {
  const searchParams = useSearchParams();
  const viewVersion = searchParams.get('viewversion');
  const restoreVersion = searchParams.get('restoreversion');
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  // Sort versions: latest draft first, then current public, then the rest
  const sortedBackups = (() => {
    // Find current public version
    const currentPublic = mockBackups.find(b => b.isCurrent && !b.isDraft);
    
    // Find latest draft version (most recent by date)
    const drafts = mockBackups.filter(b => b.isDraft);
    const latestDraft = drafts.length > 0 
      ? drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;
    
    // Get all other versions (not current public, not latest draft)
    const others = mockBackups.filter(b => 
      !(b.isCurrent && !b.isDraft) && b.id !== latestDraft?.id
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Combine in order: latest draft first, then current public, then others
    const result = [];
    if (latestDraft) result.push(latestDraft);
    if (currentPublic) result.push(currentPublic);
    result.push(...others);
    
    return result;
  })();

  const handleViewBackup = (versionNumber: number) => {
    const rootUrl = window.location.origin;
    const url = `${rootUrl}/?viewversion=${versionNumber}`;
    
    // Load in parent window if in iframe, otherwise current window
    if (window.parent && window.parent !== window) {
      // We're in an iframe, update parent window
      window.parent.location.href = url;
    } else {
      // Not in iframe, update current window
      window.location.href = url;
    }
  };

  const handlePublishDraft = (backupId: string) => {
    // In a real app, this would trigger a publish process
    logger.info('Publishing draft', { backupId });
  };

  const handleRestore = () => {
    // Reload root in parent without viewversion param
    const rootUrl = window.location.origin;
    const url = `${rootUrl}/`;
    
    if (window.parent && window.parent !== window) {
      // We're in an iframe, update parent window
      window.parent.location.href = url;
    } else {
      // Not in iframe, update current window
      window.location.href = url;
    }
  };

  const handleCancelRestore = () => {
    // Close the versions dialog by sending message to parent
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'VERSION_DIALOG_CLOSE'
      }, window.location.origin);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // If viewversion or restoreversion exists, show restore content instead of timeline
  if (viewVersion || restoreVersion) {
    return (
      <div className="bg-background p-4 flex items-center justify-center" style={{ height: '100%', minHeight: 0 }}>
        <div className="max-w-md space-y-3 w-full" style={{ height: 'auto' }}>
          <div>
            <h2 className="text-lg font-semibold">Restore version</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Restoring will discard all changes done after this version. If you change your mind simply use the version selector to revert back the current version
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelRestore} className="flex-1">
              Cancel
            </Button>
            <Button variant="outline" onClick={handleRestore} className="flex-1">
              Restore
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <MockBreadcrumb tabName="Versions" />
      
      {/* Timeline View */}
      <div className="max-w-[600px] pl-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 inset-y-0 border-l-2 border-gray-200 dark:border-gray-700" />

            {sortedBackups.map((backup, index) => {
                const IconComponent = backup.isCurrent ? Rocket : (backup.isDraft ? Code : Save);
                // Calculate version number: most recent (index 0) gets highest number
                const versionNumber = sortedBackups.length - index;
                const isCurrentPublished = backup.isCurrent && !backup.isDraft;
                
                return (
                  <div key={backup.id} className="relative pb-12 last:pb-0" style={{ paddingLeft: '40px' }}>
                    {/* Timeline Icon */}
                    <div className={`absolute left-0 -translate-x-1/2 h-9 w-9 flex items-center justify-center rounded-full ring-8 ring-background border ${
                      isCurrentPublished 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background border-border'
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="pt-2 sm:pt-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium">Version #{versionNumber}</p>
                        {backup.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Published version
                          </Badge>
                        )}
                        {backup.isDraft && (
                          <Badge variant="outline" className="text-xs">
                            Latest changes version
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{backup.title}</p>
                      
                      <div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(backup.createdAt)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm sm:text-base text-muted-foreground text-pretty">
                        {backup.description}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {!backup.isDraft && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBackup(versionNumber)}
                            className="w-auto"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View version
                          </Button>
                        )}
                        
                        {backup.isDraft && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePublishDraft(backup.id)}
                            className="w-auto"
                          >
                            <Rocket className="h-4 w-4 mr-1" />
                            Publish latest version
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

    </div>
  );
}

