"use client"

import * as React from "react"
import {
  BarChart3,
  ClipboardList,
  DollarSign,
  Home,
  Settings,
  TrendingUp,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Building2 } from "lucide-react"
import { useSession } from "@/hooks/useSession"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, hasRole, hasAnyRole } = useSession()

  if (!user) {
    return null
  }

  // Navigation items based on user roles
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
      items: [],
    },
    // Captain and Manager sections
    ...(hasAnyRole(['captain', 'manager', 'admin']) ? [{
      title: "Daily Logs",
      url: "/logs",
      icon: ClipboardList,
      items: [
        ...(hasAnyRole(['captain', 'admin']) ? [
          {
            title: "Create Log",
            url: "/logs/create",
          }
        ] : []),
        ...(hasAnyRole(['manager', 'admin']) ? [
          {
            title: "Review Logs",
            url: "/logs/review",
          }
        ] : []),
        {
          title: "View Logs",
          url: "/logs",
        },
      ],
    }] : []),
    // Sales section
    ...(hasAnyRole(['sales', 'admin']) ? [{
      title: "Commission",
      url: "/commission",
      icon: DollarSign,
      items: [
        {
          title: "Create Entry",
          url: "/commission/create",
        },
        {
          title: "Track Commission",
          url: "/commission/list",
        },
      ],
    }] : []),
    // Reports section
    ...(hasAnyRole(['manager', 'admin']) ? [{
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
      items: [
        {
          title: "Payroll Reports",
          url: "/reports/payroll",
        },
        {
          title: "Analytics",
          url: "/reports/analytics",
        },
      ],
    }] : []),
    // Employee self-service
    {
      title: "My Payroll",
      url: "/reports/my-payroll",
      icon: TrendingUp,
      items: [],
    },
    // Admin section
    ...(hasRole('admin') ? [{
      title: "Administration",
      url: "/admin",
      icon: Settings,
      items: [
        {
          title: "User Management",
          url: "/admin/users",
        },
        {
          title: "Pay Periods",
          url: "/admin/pay-periods",
        },
      ],
    }] : []),
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#026937] text-white">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-[#026937]">College Hunks</span>
            <span className="truncate text-xs text-muted-foreground">Workforce Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}