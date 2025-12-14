'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Upload, Loader2, Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/admin-ui/button';

// Force dynamic rendering for search params
export const dynamic = 'force-dynamic';

type Stage = 'uploading' | 'building' | 'complete';
type Outcome = 'success' | 'failure' | null;

const mockChanges = [
  'Updated 3 components',
  'Modified 2 API routes',
  'Changed environment configuration',
  'Added 1 new dependency',
  'Optimized bundle size',
  'Updated TypeScript types',
  'Refreshed authentication tokens',
  'Synchronized database schema',
  'Compressed static assets',
  'Validated environment variables',
  'Updated package dependencies',
  'Generated API documentation'
];

const successBuildLogs = [
  '> next build',
  'Creating an optimized production build...',
  'Compiled successfully',
  'Linting and checking validity of types...',
  '✓ Linting and checking validity of types',
  'Collecting page data...',
  '✓ Collecting page data',
  'Generating static pages (0/15)...',
  'Generating static pages (1/15)...',
  'Generating static pages (2/15)...',
  'Generating static pages (3/15)...',
  'Generating static pages (4/15)...',
  'Generating static pages (5/15)...',
  'Generating static pages (6/15)...',
  'Generating static pages (7/15)...',
  'Generating static pages (8/15)...',
  'Generating static pages (9/15)...',
  'Generating static pages (10/15)...',
  'Generating static pages (11/15)...',
  'Generating static pages (12/15)...',
  'Generating static pages (13/15)...',
  'Generating static pages (14/15)...',
  'Generating static pages (15/15)...',
  'Finalizing page optimization...',
  '✓ Page optimization completed',
  'Optimizing images...',
  '✓ Image optimization completed',
  'Generating sitemap...',
  '✓ Sitemap generated',
  'Building application bundle...',
  '✓ Application bundle created',
  '✓ Build completed successfully'
];

const failureBuildLogs = [
  '> next build',
  'Creating an optimized production build...',
  'Compiled successfully',
  'Linting and checking validity of types...',
  '✓ Linting and checking validity of types',
  'Collecting page data...',
  '✓ Collecting page data',
  'Generating static pages (0/15)...',
  'Generating static pages (1/15)...',
  'Generating static pages (2/15)...',
  'Generating static pages (3/15)...',
  'Generating static pages (4/15)...',
  'Generating static pages (5/15)...',
  'Generating static pages (6/15)...',
  'Generating static pages (7/15)...',
  'Generating static pages (8/15)...',
  'Generating static pages (9/15)...',
  'Generating static pages (10/15)...',
  'Generating static pages (11/15)...',
  'Generating static pages (12/15)...',
  'Generating static pages (13/15)...',
  'Generating static pages (14/15)...',
  'Generating static pages (15/15)...',
  'Finalizing page optimization...',
  '✓ Page optimization completed',
  'Optimizing images...',
  '✓ Image optimization completed',
  'Generating sitemap...',
  '✓ Sitemap generated',
  'Building application bundle...',
  '✕ Error: Build failed with 1 error',
  'ERROR: Type error in app/components/MyComponent.tsx:42',
  "Property 'name' does not exist on type 'User'",
  'ERROR: Failed to build application bundle',
  'ERROR: Build process terminated due to type errors',
  'Build failed. Please fix the errors above.'
];

function DevBuildProgressContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || 'myproject';

  const [stage, setStage] = useState<Stage>('uploading');
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [visibleChanges, setVisibleChanges] = useState<string[]>([]);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Randomly determine outcome on mount
  useEffect(() => {
    const randomOutcome = Math.random() > 0.3 ? 'success' : 'failure';
    setOutcome(randomOutcome);
  }, []);

  // Stage 1: Uploading changes
  useEffect(() => {
    if (stage === 'uploading') {
      setIsUpdating(true);
      mockChanges.forEach((change, index) => {
        setTimeout(() => {
          setVisibleChanges(prev => [...prev, change]);
          
          // Auto-scroll to bottom for upload stage
          setTimeout(() => {
            const logContainer = document.getElementById('build-log');
            if (logContainer) {
              logContainer.scrollTop = logContainer.scrollHeight;
            }
          }, 50);
        }, index * 225);
      });

      // Move to building stage after 2.7 seconds (12 changes * 0.225s)
      setTimeout(() => {
        setStage('building');
        setIsUpdating(false);
      }, 2700);
    }
  }, [stage]);

  // Stage 2: Building
  useEffect(() => {
    if (stage === 'building' && outcome) {
      setIsUpdating(true);
      const logs = outcome === 'success' ? successBuildLogs : failureBuildLogs;
      
      logs.forEach((log, index) => {
        setTimeout(() => {
          setVisibleLogs(prev => [...prev, log]);
          
          // Auto-scroll to bottom with multiple attempts
          setTimeout(() => {
            const logContainer = document.getElementById('build-log');
            if (logContainer) {
              logContainer.scrollTop = logContainer.scrollHeight;
            }
          }, 50);
          
          // Additional scroll attempts to ensure visibility
          setTimeout(() => {
            const logContainer = document.getElementById('build-log');
            if (logContainer) {
              logContainer.scrollTop = logContainer.scrollHeight;
            }
          }, 200);
          
          setTimeout(() => {
            const logContainer = document.getElementById('build-log');
            if (logContainer) {
              logContainer.scrollTop = logContainer.scrollHeight;
            }
          }, 500);
        }, index * 180);
      });

      // Move to complete stage after all logs (reduced time)
      setTimeout(() => {
        setStage('complete');
        setIsUpdating(false);
      }, logs.length * 180 + 300);
    }
  }, [stage, outcome]);

  // Generate fix request prompt
  const generateFixPrompt = () => {
    const timestamp = new Date().toLocaleString();
    const errorLogs = failureBuildLogs.slice(7).join('\n');
    
    return `I'm getting a build error when trying to publish my Next.js app. Please help me fix it.

Build Context:
- Project: ${subdomain}.crunchycone.dev
- Build Date: ${timestamp}
- Environment: Production build

Build Error Log:
${errorLogs}

What I need:
1. Identify the root cause of the build failure
2. Provide specific code fixes with file paths
3. Explain what caused the error

Please analyze the error and provide actionable fixes.`;
  };

  // Copy to clipboard
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const fullUrl = `https://${subdomain}.crunchycone.dev`;

  return (
    <div className="space-y-6" style={{ padding: '20px' }}>
      {/* Title and Help Text - From publish dialog for visual continuity */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Publish your app
        </h1>
        <p className="text-gray-600">
          Upload your app and set up your app url so you can share it with others
        </p>
      </div>

      {/* Coding Preview Window - Used for all stages */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          {stage === 'uploading' && (
            <>
              <div className="relative">
                <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
                <div className="absolute inset-0 h-5 w-5 bg-blue-400 rounded-full animate-ping opacity-20" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Uploading changes...
              </h2>
            </>
          )}
          {stage === 'building' && (
            <>
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <h2 className="text-lg font-semibold text-gray-900">
                Building your app...
              </h2>
            </>
          )}
          {stage === 'complete' && (
            <>
              {outcome === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <h2 className={`text-lg font-semibold ${
                outcome === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {outcome === 'success' ? 'Build completed' : 'Build failed'}
              </h2>
            </>
          )}
        </div>

        {/* Coding Preview Window - Fixed height, consistent style */}
        <div
          id="build-log"
          className="bg-gray-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto space-y-1"
        >
          {/* Stage 1: Uploading changes in terminal style */}
          {stage === 'uploading' && (
            <>
              <div className="text-gray-300">$ npm run upload</div>
              <div className="text-gray-300">Uploading project files...</div>
              {visibleChanges.map((change, index) => (
                <div
                  key={index}
                  className={`text-gray-300 animate-in fade-in duration-300 ${
                    isUpdating && index === visibleChanges.length - 1 
                      ? 'animate-pulse' 
                      : ''
                  }`}
                >
                  <span className="text-blue-400">→</span> {change}
                </div>
              ))}
              {visibleChanges.length < mockChanges.length && (
                <div className="text-gray-400 flex items-center space-x-1">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse delay-100">.</span>
                  <span className="animate-pulse delay-200">.</span>
                </div>
              )}
            </>
          )}

          {/* Stage 2 & 3: Build logs */}
          {(stage === 'building' || stage === 'complete') && (
            <>
              {visibleLogs.map((log, index) => (
                <div
                  key={index}
                  className={`animate-in fade-in duration-200 ${
                    log.includes('✓') || log.includes('successfully')
                      ? 'text-green-400'
                      : log.includes('✕') || log.includes('ERROR') || log.includes('Error')
                      ? 'text-red-400'
                      : 'text-gray-300'
                  } ${
                    isUpdating && index === visibleLogs.length - 1 
                      ? 'animate-pulse' 
                      : ''
                  }`}
                >
                  {log}
                </div>
              ))}
              {stage === 'building' && (
                <div className="flex items-center space-x-1 text-gray-400">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse delay-100">.</span>
                  <span className="animate-pulse delay-200">.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stage 3: Outcome */}
      {stage === 'complete' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {outcome === 'success' ? (
            <>
              <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">App published successfully</h3>
                  <p className="text-sm text-green-700 mt-1">{fullUrl}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => window.open(fullUrl, '_blank')}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View App</span>
                </Button>

                <Button
                  onClick={() => handleCopy(fullUrl)}
                  variant="outline"
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Publish process failed</h3>
                  <p className="text-sm text-red-700 mt-1">Build encountered errors</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => handleCopy(generateFixPrompt())}
                  variant="destructive"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy fix request prompt</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Copy fix request prompt for Cursor AI
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DevBuildProgressPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DevBuildProgressContent />
    </Suspense>
  );
}

