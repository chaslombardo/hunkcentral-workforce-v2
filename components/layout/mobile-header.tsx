"use client"

import * as React from "react"
import { Menu, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { useSession } from "@/hooks/useSession"

// Mobile navigation data (same logic as AppSidebar with grouped structure)
const getNavigationData = (userRoles: string[] = []) => {
  const isAdmin = userRoles.includes('admin')
  const isManager = userRoles.includes('manager')
  const isCaptain = userRoles.includes('captain')
  const isSales = userRoles.includes('sales')

  // Daily Operations - Core workflow items
  const dailyOperations = []
  
  // Dashboard is always available
  dailyOperations.push({
    title: "Dashboard",
    url: "/dashboard",
    icon: Building2,
    items: [],
  })

  // Daily Logs for captains and managers
  if (isCaptain || isManager || isAdmin) {
    dailyOperations.push({
      title: "Daily Logs",
      url: "/logs",
      items: [
        ...(isCaptain || isAdmin ? [
          { title: "Create Log", url: "/logs/create" }
        ] : []),
        ...(isManager || isAdmin ? [
          { title: "Review Logs", url: "/logs/review" }
        ] : []),
        { title: "View Logs", url: "/logs" },
      ],
    })
  }

  // Commission tracking for sales staff
  if (isSales || isAdmin) {
    dailyOperations.push({
      title: "Commission",
      url: "/commission",
      items: [
        { title: "Create Entry", url: "/commission/create" },
        { title: "Track Commission", url: "/commission/list" },
      ],
    })
  }

  // Reports & Analytics - Data and insights
  const reportsAnalytics = []

  // Employee self-service payroll (always available)
  reportsAnalytics.push({
    title: "My Payroll",
    url: "/reports/my-payroll",
    items: [],
  })

  // Management reports for managers and admins
  if (isManager || isAdmin) {
    reportsAnalytics.push({
      title: "Payroll Reports",
      url: "/reports/payroll",
      items: [
        { title: "Current Period", url: "/reports/payroll" },
        { title: "Analytics", url: "/reports/analytics" },
      ],
    })
  }

  // Administration - System management
  const administration = []
  
  if (isAdmin) {
    administration.push({
      title: "User Management",
      url: "/admin/users",
      items: [
        { title: "All Users", url: "/admin/users" },
        { title: "Pay Periods", url: "/admin/pay-periods" },
        { title: "Audit Trail", url: "/admin/audit" },
      ],
    })
  }

  return { dailyOperations, reportsAnalytics, administration }
}

export function MobileHeader() {
  const { user } = useSession()
  
  if (!user) {
    return null
  }
  
  const navigationData = getNavigationData(user.roles)

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#026937] text-white">
          <Building2 className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium text-[#026937]">College Hunks</span>
          <span className="truncate text-xs text-muted-foreground">Workforce Management</span>
        </div>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b pb-4">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#026937] text-white">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-[#026937]">College Hunks</span>
                <span className="truncate text-xs text-muted-foreground">Workforce Management</span>
              </div>
            </div>
            
            <div className="flex-1 py-4">
              <NavMain 
                title="Daily Operations" 
                items={navigationData.dailyOperations} 
              />
              {navigationData.reportsAnalytics.length > 0 && (
                <NavMain 
                  title="Reports & Analytics" 
                  items={navigationData.reportsAnalytics} 
                />
              )}
              {navigationData.administration.length > 0 && (
                <NavMain 
                  title="Administration" 
                  items={navigationData.administration} 
                />
              )}
            </div>
            
            <div className="border-t pt-4">
              <NavUser user={user} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}