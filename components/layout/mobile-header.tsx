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

// Mobile navigation data (same logic as AppSidebar)
const getNavigationData = (userRoles: string[] = []) => {
  const isAdmin = userRoles.includes('admin')
  const isManager = userRoles.includes('manager')
  const isCaptain = userRoles.includes('captain')
  const isSales = userRoles.includes('sales')

  const navItems = []

  navItems.push({
    title: "Dashboard",
    url: "/dashboard",
    icon: Building2,
    isActive: true,
  })

  if (isCaptain || isManager || isAdmin) {
    const logItems = []
    
    if (isCaptain || isAdmin) {
      logItems.push({ title: "Create Log", url: "/logs/create" })
    }
    
    if (isManager || isAdmin) {
      logItems.push({ title: "Review Logs", url: "/logs/review" })
    }

    navItems.push({
      title: "Daily Logs",
      url: "/logs",
      items: logItems,
    })
  }

  if (isSales || isAdmin) {
    navItems.push({
      title: "Commission",
      url: "/commission",
      items: [
        { title: "Create Entry", url: "/commission/create" },
        { title: "Track Status", url: "/commission/list" },
      ],
    })
  }

  if (isManager || isAdmin) {
    navItems.push({
      title: "Reports",
      url: "/reports",
      items: [
        { title: "Payroll Reports", url: "/reports/payroll" },
        { title: "My Payroll", url: "/reports/my-payroll" },
      ],
    })
  }

  if (isAdmin) {
    navItems.push({
      title: "Administration",
      url: "/admin",
      items: [
        { title: "User Management", url: "/admin/users" },
        { title: "Pay Periods", url: "/admin/pay-periods" },
      ],
    })
  }

  return { navMain: navItems }
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
              <NavMain items={navigationData.navMain} />
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