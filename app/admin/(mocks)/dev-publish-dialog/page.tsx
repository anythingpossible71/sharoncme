'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DevPublishDialog } from '@/components/admin/DevPublishDialog';

// Force dynamic rendering for search params
export const dynamic = 'force-dynamic';

function DevPublishDialogContent() {
  const searchParams = useSearchParams();
  
  // Get published state and available state from URL parameters
  const hasPublished = searchParams.get('published') === 'true';
  const isAvailable = searchParams.get('available') !== 'false';
  const subdomain = searchParams.get('subdomain') || 'myproject';

  return (
    <DevPublishDialog
      subdomain={subdomain}
      hasPublished={hasPublished}
      isAvailable={isAvailable}
    />
  );
}

export default function DevPublishDialogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DevPublishDialogContent />
    </Suspense>
  );
}
