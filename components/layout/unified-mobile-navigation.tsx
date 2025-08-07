"use client"

import * as React from "react"
import { 
  Home, 
  ClipboardList, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Menu,
  Building2,
  Plus
} from "lucide-react"
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
import { NavigationItemWithBadge } from "@/components/layout/navigation-badge"
import { useSession } from "@/hooks/useSession"
import { useHapticFeedback } from "@/hooks/useHapticFeedback"
import { useNavigation } from "@/contexts/navigation-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// Navigation data structure for unified mobile navigation
const getNavigationData = (userRoles: string[] = []) => {
  const isAdmin = userRoles.includes('admin')
  const isManager = userRoles.includes('manager')
  const isCaptain = userRoles.includes('captain')
  const isSales = userRoles.includes('sales')

  // Bottom navigation items (max 5 for optimal mobile UX)
  const bottomNavItems = []
  
  // Dashboard is always first
  bottomNavItems.push({
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    isActive: false,
  })

  // Daily Logs for captains and managers
  if (isCaptain || isManager || isAdmin) {
    bottomNavItems.push({
      title: "Logs",
      url: "/logs",
      icon: ClipboardList,
      isActive: false,
    })
  }

  // Commission for sales staff
  if (isSales || isAdmin) {
    bottomNavItems.push({
      title: "Commission",
      url: "/commission",
      icon: DollarSign,
      isActive: false,
    })
  }

  // My Payroll (always available)
  bottomNavItems.push({
    title: "Payroll",
    url: "/reports/my-payroll",
    icon: TrendingUp,
    isActive: false,
  })

  // More menu for additional items
  bottomNavItems.push({
    title: "More",
    url: "#",
    icon: Menu,
    isActive: false,
    isMore: true,
  })

  // Full navigation groups for the "More" menu
  const navigationGroups = []

  // Daily Operations Group
  const dailyOperations = []
  
  dailyOperations.push({
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
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
      icon: ClipboardList,
      items: logItems,
    })
  }

  if (isSales || isAdmin) {
    dailyOperations.push({
      title: "Commission",
      url: "/commission",
      icon: DollarSign,
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
  
  reportsAnalytics.push({
    title: "My Payroll",
    url: "/reports/my-payroll",
    icon: TrendingUp,
  })

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
        icon: Settings,
        items: [
          { title: "All Users", url: "/admin/users" },
          { title: "Pay Periods", url: "/admin/pay-periods" },
          { title: "Audit Trail", url: "/admin/audit" },
        ],
      }]
    })
  }

  // Quick actions for FAB
  const quickActions = []
  
  if (isCaptain || isAdmin) {
    quickActions.push({
      title: "Create Log",
      description: "Start a new daily log",
      url: "/logs/create",
      color: "bg-[#026937]"
    })
  }
  
  if (isSales || isAdmin) {
    quickActions.push({
      title: "Add Commission",
      description: "Enter a new commission",
      url: "/commission/create",
      color: "bg-[#ea7200]"
    })
  }
  
  if (isManager || isAdmin) {
    quickActions.push({
      title: "Review Logs",
      description: "Approve pending logs",
      url: "/logs/review",
      color: "bg-blue-600"
    })
  }

  return { bottomNavItems, navigationGroups, quickActions }
}

// Mobile header component
export function UnifiedMobileHeader() {
  const { user } = useSession()
  const pathname = usePathname()
  
  if (!user) {
    return null
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

// Bottom navigation component
export function UnifiedBottomNavigation() {
  const { user } = useSession()
  const pathname = usePathname()
  const { tapFeedback } = useHapticFeedback()
  const { state, isActiveRoute } = useNavigation()
  
  if (!user) {
    return null
  }
  
  const { bottomNavItems } = getNavigationData(user.roles)
  
  // Update active state based on current path
  const updatedNavItems = bottomNavItems.map(item => ({
    ...item,
    isActive: item.url !== "#" && isActiveRoute(item.url)
  }))

  const handleNavClick = () => {
    tapFeedback()
  }

  // Helper function to get badge info for mobile navigation items
  const getBadgeInfo = (url: string) => {
    const badgeMap: Record<string, string> = {
      '/logs': 'logs-review',
      '/commission': 'commission-pending',
      '/reports/my-payroll': '', // No badges for payroll
      '/dashboard': '', // No badges for dashboard
    }

    const badgeId = badgeMap[url]
    if (!badgeId || !state.badges[badgeId]) {
      return { count: 0, type: 'pending' as const }
    }

    const badge = state.badges[badgeId]
    return { count: badge.count, type: badge.type }
  }

  return (
    <div className="md:hidden">
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="flex items-center justify-around px-2 py-2">
          {updatedNavItems.map((item) => (
            item.isMore ? (
              <MoreMenuButton key={item.title} />
            ) : (
              <Link key={item.title} href={item.url} onClick={handleNavClick}>
                <NavigationItemWithBadge 
                  badgeCount={getBadgeInfo(item.url).count} 
                  badgeType={getBadgeInfo(item.url).type}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex flex-col items-center gap-1 h-12 w-16 p-1 text-xs font-normal touch-manipulation",
                      "min-h-[48px] min-w-[48px]", // Ensure 48px minimum touch target
                      item.isActive 
                        ? "text-[#026937] bg-[#026937]/10" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="truncate">{item.title}</span>
                  </Button>
                </NavigationItemWithBadge>
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
  )
}

// More menu button component
function MoreMenuButton() {
  const { user } = useSession()
  const [isOpen, setIsOpen] = React.useState(false)
  const { tapFeedback, selectionFeedback } = useHapticFeedback()
  
  if (!user) return null

  const { navigationGroups } = getNavigationData(user.roles)

  const handleNavigate = () => {
    tapFeedback()
    setIsOpen(false)
  }

  const handleMoreClick = () => {
    selectionFeedback()
    setIsOpen(true)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 h-12 w-16 p-1 text-xs font-normal text-muted-foreground hover:text-foreground touch-manipulation min-h-[48px] min-w-[48px]"
          onClick={handleMoreClick}
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#026937] text-white">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <SheetTitle className="truncate font-medium text-[#026937]">College Hunks</SheetTitle>
                  <span className="truncate text-xs text-muted-foreground">All Features</span>
                </div>
              </div>
            </div>
          </SheetHeader>
          
          <Separator />
          
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-4">
              {navigationGroups.map((group, groupIndex) => (
                <div key={group.title}>
                  <div className="px-2 py-1 text-xs font-semibold text-[#026937] uppercase tracking-wider">
                    {group.title}
                  </div>
                  <div className="space-y-1 mt-2">
                    {group.items.map((item) => (
                      <MobileNavItem
                        key={item.title}
                        item={item}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                  {groupIndex < navigationGroups.length - 1 && (
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
  )
}

// Mobile navigation item component
interface MobileNavItemProps {
  item: {
    title: string
    url: string
    icon?: React.ComponentType<{ className?: string }>
    items?: { title: string; url: string }[]
  }
  onNavigate: () => void
}

function MobileNavItem({ item, onNavigate }: MobileNavItemProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = React.useState(false)
  const { tapFeedback, selectionFeedback } = useHapticFeedback()
  const { state } = useNavigation()
  const isActive = pathname === item.url || (item.items && item.items.some(subItem => pathname === subItem.url))

  const handleExpandClick = () => {
    selectionFeedback()
    setIsExpanded(!isExpanded)
  }

  const handleNavClick = () => {
    tapFeedback()
    onNavigate()
  }

  // Helper function to get badge info for mobile navigation items
  const getBadgeInfo = (url: string) => {
    const badgeMap: Record<string, string> = {
      '/logs': 'logs-review',
      '/logs/review': 'logs-review',
      '/logs/create': 'logs-draft',
      '/commission': 'commission-pending',
      '/commission/list': 'commission-pending',
    }

    const badgeId = badgeMap[url]
    if (!badgeId || !state.badges[badgeId]) {
      return { count: 0, type: 'pending' as const }
    }

    const badge = state.badges[badgeId]
    return { count: badge.count, type: badge.type }
  }

  if (item.items && item.items.length > 0) {
    const badgeInfo = getBadgeInfo(item.url)
    
    return (
      <div className="space-y-1">
        <NavigationItemWithBadge 
          badgeCount={badgeInfo.count} 
          badgeType={badgeInfo.type}
          className="w-full"
        >
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between h-12 px-4 text-left font-normal touch-manipulation",
              "min-h-[48px]", // Ensure 48px minimum touch target
              isActive && "bg-accent text-accent-foreground"
            )}
            onClick={handleExpandClick}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon className="h-5 w-5" />}
              <span>{item.title}</span>
            </div>
            <Menu className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
          </Button>
        </NavigationItemWithBadge>
        {isExpanded && (
          <div className="ml-8 space-y-1">
            {item.items.map((subItem) => {
              const subBadgeInfo = getBadgeInfo(subItem.url)
              
              return (
                <Link key={subItem.url} href={subItem.url} onClick={handleNavClick}>
                  <NavigationItemWithBadge 
                    badgeCount={subBadgeInfo.count} 
                    badgeType={subBadgeInfo.type}
                    className="w-full"
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 px-4 text-left font-normal text-sm touch-manipulation",
                        "min-h-[48px]", // Ensure 48px minimum touch target
                        pathname === subItem.url && "bg-accent text-accent-foreground"
                      )}
                    >
                      {subItem.title}
                    </Button>
                  </NavigationItemWithBadge>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const badgeInfo = getBadgeInfo(item.url)

  return (
    <Link href={item.url} onClick={handleNavClick}>
      <NavigationItemWithBadge 
        badgeCount={badgeInfo.count} 
        badgeType={badgeInfo.type}
        className="w-full"
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-12 px-4 text-left font-normal touch-manipulation",
            "min-h-[48px]", // Ensure 48px minimum touch target
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon && <item.icon className="h-5 w-5" />}
            <span>{item.title}</span>
          </div>
        </Button>
      </NavigationItemWithBadge>
    </Link>
  )
}

// Floating Action Button for quick actions
export function UnifiedQuickActionsFAB() {
  const { user } = useSession()
  const { impactFeedback, tapFeedback } = useHapticFeedback()
  
  if (!user) return null

  const { quickActions } = getNavigationData(user.roles)

  if (quickActions.length === 0) return null

  const handleFABClick = () => {
    impactFeedback()
  }

  const handleActionClick = () => {
    tapFeedback()
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button 
          className={cn(
            "fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg",
            "bg-[#026937] hover:bg-[#026937]/90 md:hidden",
            "min-h-[56px] min-w-[56px] touch-manipulation" // Larger touch target for FAB
          )}
          size="icon"
          onClick={handleFABClick}
        >
          <Plus className="h-6 w-6" />
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
                <Link key={action.url} href={action.url} onClick={handleActionClick}>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-16 justify-start text-left touch-manipulation",
                      "min-h-[48px]" // Ensure 48px minimum touch target
                    )}
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