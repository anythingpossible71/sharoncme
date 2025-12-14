import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { ConditionalThemeProvider } from "@/components/ConditionalThemeProvider";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { SnapshotHeader } from "@/components/SnapshotHeader";
import { AdminBar } from "@/components/AdminBar";
import { getAppSettings } from "@/app/actions/app-settings";
import { appThemeConfig } from "@/config/app-theme.config";
import "./globals.css";

// Initialize structured logging for production
import "@/lib/utils/logger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  return {
    title: settings.appName,
    description:
      settings.appDescription || "A production-ready Next.js starter with auth and admin dashboard",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {/* Block app theme from being applied to admin routes before React hydrates */}
        {/* This script runs synchronously before any other scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Check if this is an admin route or redirect route
                const pathname = window.location.pathname;
                const isAdminRoute = pathname.startsWith('/admin');
                const isRedirectRoute = pathname.startsWith('/redirect');
                
                console.log('[AppTheme] Root layout script running', {
                  pathname: pathname,
                  isAdminRoute: isAdminRoute,
                  isRedirectRoute: isRedirectRoute,
                  appThemeBefore: localStorage.getItem('app-theme'),
                  themeBefore: localStorage.getItem('theme'),
                  timestamp: new Date().toISOString()
                });
                
                // Redirect route: clear all themes but don't set any (redirect page handles cleanup)
                if (isRedirectRoute) {
                  const htmlElement = document.documentElement;
                  htmlElement.removeAttribute('data-admin-theme');
                  htmlElement.removeAttribute('data-app-theme');
                  // Remove theme classes
                  const themeClasses = ['light', 'dark', 'ocean', 'forest', 'midnight',
                    'strawberry-swirl', 'sunset-sorbet', 'lavender-honey',
                    'matcha-latte', 'blueberry-cheesecake', 'rocky-road',
                    'orange-creamsicle', 'caramel-drizzle', 'cotton-candy',
                    'birthday-cake', 'ube', 'lemon-meringue', 'pistachio-almond',
                    'tutti-frutti', 'electric-mango', 'raspberry-rush',
                    'lime-zing', 'grape-soda', 'cherry-bomb',
                    'blue-lagoon', 'supercharged-orange', 'vivid-violet',
                    'kiwi-splash', 'passion-fruit-punch'];
                  themeClasses.forEach(function(themeClass) {
                    htmlElement.classList.remove(themeClass);
                  });
                  console.log('[AppTheme] Redirect route - cleared all themes');
                  return; // Exit early, don't set any themes
                }
                
                // Clear app theme if it's an admin route (route-based decision only)
                if (isAdminRoute) {
                  // Prevent app theme from being applied by clearing app theme localStorage
                  // and removing app theme classes immediately
                  try {
                    const appThemeBefore = localStorage.getItem('app-theme');
                    const themeBefore = localStorage.getItem('theme');
                    console.log('[AppTheme] Admin route detected - preserving app theme localStorage', {
                      appThemeBefore: appThemeBefore,
                      themeBefore: themeBefore,
                      timestamp: new Date().toISOString()
                    });
                    // DO NOT clear localStorage - preserve user's theme choice
                    // Separation is DOM-based (data-admin-theme vs data-app-theme), not localStorage-based
                    
                    // Remove app theme classes from HTML element
                    const htmlElement = document.documentElement;
                    
                    // CRITICAL: Remove data-app-theme FIRST to ensure admin CSS can apply
                    // Admin CSS uses :not([data-app-theme]) so removing this allows admin CSS to work
                    if (htmlElement.hasAttribute('data-app-theme')) {
                      htmlElement.removeAttribute('data-app-theme');
                      console.log('[AppTheme] Removed data-app-theme attribute on admin route');
                    }
                    
                    const appThemeClasses = [
                      'ocean', 'forest', 'midnight',
                      'strawberry-swirl', 'sunset-sorbet', 'lavender-honey',
                      'matcha-latte', 'blueberry-cheesecake', 'rocky-road',
                      'orange-creamsicle', 'caramel-drizzle', 'cotton-candy',
                      'birthday-cake', 'ube', 'lemon-meringue', 'pistachio-almond',
                      'tutti-frutti', 'electric-mango', 'raspberry-rush',
                      'lime-zing', 'grape-soda', 'cherry-bomb',
                      'blue-lagoon', 'supercharged-orange', 'vivid-violet',
                      'kiwi-splash', 'passion-fruit-punch'
                    ];
                    
                    appThemeClasses.forEach(function(themeClass) {
                      htmlElement.classList.remove(themeClass);
                    });
                    
                    // Ensure admin theme uses light (clear any dark theme from localStorage)
                    const adminTheme = localStorage.getItem('admin-theme');
                    if (adminTheme && adminTheme !== 'light') {
                      localStorage.setItem('admin-theme', 'light');
                      console.log('[AppTheme] Cleared dark admin theme from localStorage, set to light');
                    }
                    
                    // CRITICAL: Remove any existing data-admin-theme="dark" attribute first
                    // This prevents dark theme from being applied if it was set previously
                    if (htmlElement.hasAttribute('data-admin-theme')) {
                      const currentTheme = htmlElement.getAttribute('data-admin-theme');
                      if (currentTheme === 'dark') {
                        htmlElement.removeAttribute('data-admin-theme');
                        console.log('[AppTheme] Removed data-admin-theme="dark" attribute');
                      }
                    }
                    
                    // CRITICAL: Set data-admin-theme="light" immediately to prevent flicker
                    // This must happen before React hydrates and before CSS is applied
                    // Do this AFTER removing any dark theme to ensure light theme applies
                    htmlElement.setAttribute('data-admin-theme', 'light');
                    console.log('[AppTheme] Set data-admin-theme="light" immediately on admin route');
                  } catch (e) {
                    console.error('[AppTheme] Error in root layout script', e);
                  }
                } else {
                  // App route - ensure admin theme attribute is removed
                  const htmlElement = document.documentElement;
                  if (htmlElement.hasAttribute('data-admin-theme')) {
                    htmlElement.removeAttribute('data-admin-theme');
                    console.log('[AppTheme] Removed data-admin-theme attribute from app route');
                  }
                  
                  // CRITICAL: Set up localStorage interceptor for preview mode BEFORE React hydrates
                  // This prevents next-themes from writing to localStorage during preview
                  // Interceptor checks URL parameter on every write (for iframe reloads)
                  const originalSetItem = Storage.prototype.setItem;
                  Storage.prototype.setItem = function(key, value) {
                    // Check if preview-theme is in URL (for iframe reloads with new themes)
                    const currentUrlParams = new URLSearchParams(window.location.search);
                    const currentPreviewTheme = currentUrlParams.get('preview-theme');
                    
                    // Block localStorage writes for app-theme during preview mode
                    if (key === 'app-theme' && currentPreviewTheme) {
                      console.log('[AppTheme] Blocked localStorage write during preview mode (synchronous)', {
                        key: key,
                        attemptedValue: value,
                        previewTheme: currentPreviewTheme,
                        timestamp: new Date().toISOString()
                      });
                      return; // Don't write - zero persistence
                    }
                    originalSetItem.call(this, key, value);
                  };
                  
                  // Log if preview mode is active
                  const urlParams = new URLSearchParams(window.location.search);
                  const previewTheme = urlParams.get('preview-theme');
                  if (previewTheme) {
                    console.log('[AppTheme] Synchronous localStorage interceptor active for preview mode', {
                      previewTheme: previewTheme,
                      timestamp: new Date().toISOString()
                    });
                  }
                  
                  // CRITICAL: Set data-app-theme immediately to prevent admin CSS from applying
                  // Admin CSS uses :not([data-app-theme]) so setting this prevents admin CSS
                  // This must happen before React hydrates to prevent flicker
                  // PRIORITY: localStorage wins if exists, otherwise fallback to config (no localStorage write)
                  const configDefaultTheme = '${appThemeConfig.currentTheme}';
                  
                  // Check localStorage first (user preference) - this WINS
                  const appThemeFromStorage = localStorage.getItem('app-theme');
                  const legacyThemeFromStorage = localStorage.getItem('theme');
                  
                  // Priority: app-theme > legacy theme > config default
                  const selectedTheme = appThemeFromStorage || legacyThemeFromStorage || configDefaultTheme;
                  const themeSource = appThemeFromStorage ? 'localStorage[app-theme]' : 
                                     legacyThemeFromStorage ? 'localStorage[theme]' : 
                                     'config default';
                  
                  // Resolve system theme to light/dark for immediate DOM application
                  let resolvedTheme = selectedTheme;
                  if (selectedTheme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    resolvedTheme = prefersDark ? 'dark' : 'light';
                  }
                  
                  // Set the resolved theme immediately - next-themes will sync after hydration
                  if (!htmlElement.hasAttribute('data-app-theme')) {
                    htmlElement.setAttribute('data-app-theme', resolvedTheme);
                    htmlElement.classList.add(resolvedTheme);
                    console.log('[AppTheme] Set data-app-theme immediately (localStorage wins if exists)', {
                      selectedTheme: selectedTheme,
                      themeSource: themeSource,
                      configDefaultTheme: configDefaultTheme,
                      resolvedTheme: resolvedTheme,
                      hasLocalStorage: !!appThemeFromStorage || !!legacyThemeFromStorage
                    });
                  }
                  
                  // App route - log but don't clear
                  console.log('[AppTheme] App route detected - preserving app theme', {
                    appTheme: localStorage.getItem('app-theme'),
                    theme: localStorage.getItem('theme'),
                    timestamp: new Date().toISOString()
                  });
                }
              })();
            `,
          }}
        />
        <SessionProvider>
          <ConditionalThemeProvider>
            <SnapshotHeader />
            <AdminBar />
            {children}
          </ConditionalThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
