'use client';

import React, { ReactNode, useEffect } from 'react';
import { AdminThemeProvider } from '@/components/admin/AdminThemeProvider';
import { getAdminTheme } from '@/app/actions/theme-settings';

interface MockLayoutProps {
  children: ReactNode;
}

export default function MockLayout({ children }: MockLayoutProps) {
  const [defaultTheme, setDefaultTheme] = React.useState('pistachio-almond');

  useEffect(() => {
    // Load the admin theme to match admin interface
    getAdminTheme().then((savedTheme) => {
      if (savedTheme) {
        setDefaultTheme(savedTheme);
      }
    });
  }, []);

  return (
    <AdminThemeProvider defaultTheme={defaultTheme}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </AdminThemeProvider>
  );
}
