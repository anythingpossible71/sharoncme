'use client';

import { useState } from 'react';
import { Button } from '@/components/admin-ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/admin-ui/card';
import { Save, Rocket, Eye, RotateCcw, Calendar, Code } from 'lucide-react';
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

export default function MockBackupsPage() {
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);

  // Sort versions: current public first, then latest draft, then the rest
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
    
    // Combine in order: current public, latest draft, then others
    const result = [];
    if (currentPublic) result.push(currentPublic);
    if (latestDraft) result.push(latestDraft);
    result.push(...others);
    
    return result;
  })();

  const handleViewBackup = (backupId: string, isCurrent: boolean) => {
    const rootUrl = window.location.origin;
    if (isCurrent) {
      // For current production version, open without backup parameter
      window.open(rootUrl, '_blank');
    } else {
      // For backups, open with backup parameter
      const backupUrl = `${rootUrl}/?snapshotid=${backupId}`;
      window.open(backupUrl, '_blank');
    }
  };

  const handleRestoreBackup = (backupId: string) => {
    setBackupToRestore(backupId);
    setShowRestoreDialog(true);
  };

  const handlePublishDraft = (backupId: string) => {
    // In a real app, this would trigger a publish process
    logger.info('Publishing draft', { backupId });
  };

  const confirmRestore = () => {
    if (backupToRestore) {
      logger.info('Restoring backup', { backupToRestore });
      setShowRestoreDialog(false);
      setBackupToRestore(null);
    }
  };

  const cancelRestore = () => {
    setShowRestoreDialog(false);
    setBackupToRestore(null);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <MockBreadcrumb tabName="Versions" />
      
      {/* Timeline View */}
      <Card className="p-6 w-full">
        <div className="max-w-[600px] pl-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 inset-y-0 border-l-2 border-gray-200 dark:border-gray-700" />

              {sortedBackups.map((backup, index) => {
                const IconComponent = backup.isCurrent ? Rocket : (backup.isDraft ? Code : Save);
                
                return (
                  <div key={backup.id} className="relative pb-12 last:pb-0" style={{ paddingLeft: '40px' }}>
                    {/* Timeline Icon */}
                    <div className={`absolute left-0 -translate-x-1/2 h-9 w-9 flex items-center justify-center rounded-full ring-8 ring-background ${
                      backup.isCurrent 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background border border-border text-muted-foreground'
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="pt-2 sm:pt-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium">{backup.title}</p>
                        {backup.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current public version
                          </Badge>
                        )}
                        {backup.isDraft && (
                          <Badge variant="secondary" className="text-xs">
                            Current draft version
                          </Badge>
                        )}
                      </div>
                      
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
                            variant={backup.isCurrent ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleViewBackup(backup.id, backup.isCurrent)}
                            className="w-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {backup.isCurrent ? "View current public version" : "View Backup"}
                          </Button>
                        )}
                        
                        {backup.isDraft && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePublishDraft(backup.id)}
                            className="w-auto"
                          >
                            <Rocket className="h-4 w-4 mr-2" />
                            Publish draft - Make it our public version
                          </Button>
                        )}
                        
                        {!backup.isCurrent && !backup.isDraft && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreBackup(backup.id)}
                            className="w-auto"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

      {/* Restore Confirmation Dialog */}
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore to this point in time</DialogTitle>
              <DialogDescription>
                Choosing to restore will revert your app's code to this point in time. Take into account THIS CHANGE IS NOT REVERSIBLE.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelRestore}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmRestore}>
                Restore code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}

