'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
  showDateRangePicker?: boolean;
}

export function ProtectedLayout({
  children,
  breadcrumbs = [],
  showDateRangePicker = false,
}: ProtectedLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader
          breadcrumbs={breadcrumbs}
          showDateRangePicker={showDateRangePicker}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
