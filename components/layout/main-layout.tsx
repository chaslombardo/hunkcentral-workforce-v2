"use client"

import * as React from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SmartBreadcrumbs } from "@/components/layout/smart-breadcrumbs"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { OfflineIndicator, ConnectionQualityIndicator } from "@/components/ui/offline-indicator"
import { ThemeSwitcher } from "@/components/theme-switcher"


interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <SmartBreadcrumbs />
          </div>
          <div className="flex items-center gap-2 px-4">
            <ThemeSwitcher />
            <OfflineIndicator />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ConnectionQualityIndicator />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}