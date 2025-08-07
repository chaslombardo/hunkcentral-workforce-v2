"use client"

import * as React from "react"
import { Menu, Building2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Separator } from "@/components/ui/separator"
import { NavUser } from "@/components/layout/nav-user"
import { SmartBreadcrumbs } from "@/components/layout/smart-breadcrumbs"
import { useSession } from "@/hooks/useSession"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// Mobile navigation data (same logic as AppSidebar with grouped structure)
const getNavigationData = (userRoles: string[] = []) => {
  const isAdmin = userRoles.includes('admin')
  const isManager = userRoles.includes('manager')
  const isCaptain = userRoles.includes('captain')
  const isSales = userRoles.includes('sales')

  const navigationGroups = []

  // Daily Operations Group
  const dailyOperations = []
  
  dailyOperations.push({
    title: "Dashboard",
    url: "/dashboard",
    icon: Building2,
  })

  if (isCaptain || isManager || isAdmin) {
    const logItems = []
    
    if (isCaptain || isAdmin) {
      logItems.push({ title: "Create Log", url: "/logs/create" })
    }
    
    if (isManager || isAdmin) {
      logItems.push({ title: "Review Logs", url: "/logs/review" })
    }
    
    logItems.push({ title: "View Logs", url: "/logs" })

    dailyOperations.push({
      title: "Daily Logs",
      url: "/logs",
      items: logItems,
    })
  }

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

  if (dailyOperations.length > 0) {
    navigationGroups.push({
      title: "Daily Operations",
      items: dailyOperations
    })
  }

  // Reports & Analytics Group
  const reportsAnalytics = []
  
  // Employee self-service payroll (always available)
  reportsAnalytics.push({
    title: "My Payroll",
    url: "/reports/my-payroll",
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

  if (reportsAnalytics.length > 0) {
    navigationGroups.push({
      title: "Reports & Analytics",
      items: reportsAnalytics
    })
  }

  // Administration Group
  if (isAdmin) {
    navigationGroups.push({
      title: "Administration",
      items: [{
        title: "User Management",
        url: "/admin/users",
        items: [
          { title: "All Users", url: "/admin/users" },
          { title: "Pay Periods", url: "/admin/pay-periods" },
          { title: "Audit Trail", url: "/admin/audit" },
        ],
      }]
    })
  }

  return { navigationGroups }
}

interface MobileNavItemProps {
  item: {
    title: string
    url: string
    icon?: React.ComponentType<{ className?: string }>
    items?: { title: string; url: string }[]
  }
  pathname: string
  onNavigate: () => void
}

function MobileNavItem({ item, pathname, onNavigate }: MobileNavItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const isActive = pathname === item.url || (item.items && item.items.some(subItem => pathname === subItem.url))

  if (item.items && item.items.length > 0) {
    return (
      <div className="space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between h-12 px-4 text-left font-normal",
            isActive && "bg-accent text-accent-foreground"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {item.icon && <item.icon className="h-5 w-5" />}
            <span>{item.title}</span>
          </div>
          <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
        </Button>
        {isExpanded && (
          <div className="ml-8 space-y-1">
            {item.items.map((subItem) => (
              <Link key={subItem.url} href={subItem.url} onClick={onNavigate}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10 px-4 text-left font-normal text-sm",
                    pathname === subItem.url && "bg-accent text-accent-foreground"
                  )}
                >
                  {subItem.title}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link href={item.url} onClick={onNavigate}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start h-12 px-4 text-left font-normal",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          {item.icon && <item.icon className="h-5 w-5" />}
          <span>{item.title}</span>
        </div>
      </Button>
    </Link>
  )
}

// Enhanced Mobile Header with better touch targets
export function EnhancedMobileHeader() {
  const { user } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  
  if (!user) {
    return null
  }
  
  const navigationData = getNavigationData(user.roles)

  const handleNavigate = () => {
    setIsOpen(false)
  }

  return (
    <div className="md:hidden">
      <div className="flex h-16 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#026937] text-white">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-[#026937]">College Hunks</span>
            <span className="truncate text-xs text-muted-foreground">Workforce Management</span>
          </div>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12" // Larger touch target
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#026937] text-white">
                    <Building2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <SheetTitle className="truncate font-medium text-[#026937]">College Hunks</SheetTitle>
                    <span className="truncate text-xs text-muted-foreground">Workforce Management</span>
                  </div>
                </div>
              </div>
            </SheetHeader>
            
            <Separator />
            
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-4">
                {navigationData.navigationGroups.map((group, groupIndex) => (
                  <div key={group.title}>
                    <div className="px-2 py-1 text-xs font-semibold text-[#026937] uppercase tracking-wider">
                      {group.title}
                    </div>
                    <div className="space-y-1 mt-2">
                      {group.items.map((item) => (
                        <MobileNavItem
                          key={item.title}
                          item={item}
                          pathname={pathname}
                          onNavigate={handleNavigate}
                        />
                      ))}
                    </div>
                    {groupIndex < navigationData.navigationGroups.length - 1 && (
                      <Separator className="mt-4 bg-[#026937]/20" />
                    )}
                  </div>
                ))}
              </nav>
            </div>
            
            <Separator />
            
            <div className="p-4">
              <NavUser user={user} />
            </div>
          </div>
        </SheetContent>
        </Sheet>
      </div>
      
      {/* Mobile breadcrumbs - shown below header */}
      <div className="border-b bg-background px-4 py-2">
        <SmartBreadcrumbs 
          className="flex sm:hidden" 
          maxItems={3} 
          showIcons={false}
        />
      </div>
    </div>
  )
}

// Quick Actions Drawer for mobile
export function MobileQuickActions() {
  const { user } = useSession()
  
  if (!user) return null

  const quickActions = []
  
  if (user.roles.includes('captain') || user.roles.includes('admin')) {
    quickActions.push({
      title: "Create Log",
      description: "Start a new daily log",
      url: "/logs/create",
      color: "bg-[#026937]"
    })
  }
  
  if (user.roles.includes('sales') || user.roles.includes('admin')) {
    quickActions.push({
      title: "Add Commission",
      description: "Enter a new commission",
      url: "/commission/create",
      color: "bg-[#ea7200]"
    })
  }
  
  if (user.roles.includes('manager') || user.roles.includes('admin')) {
    quickActions.push({
      title: "Review Logs",
      description: "Approve pending logs",
      url: "/logs/review",
      color: "bg-blue-600"
    })
  }

  if (quickActions.length === 0) return null

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#026937] hover:bg-[#026937]/90 md:hidden"
          size="icon"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Quick actions</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Quick Actions</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-8">
            <div className="grid gap-3">
              {quickActions.map((action) => (
                <Link key={action.url} href={action.url}>
                  <Button
                    variant="outline"
                    className="w-full h-16 justify-start text-left"
                  >
                    <div className={cn("w-3 h-3 rounded-full mr-3", action.color)} />
                    <div>
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}