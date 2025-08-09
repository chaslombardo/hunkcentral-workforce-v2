"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization"
import {
  Home,
  ClipboardList,
  DollarSign,
  BarChart3,
  TrendingUp,
  Settings,
  Users,
  Calendar,
  FileText,
  Eye,
  Plus,
  CheckCircle,
  User,
  Activity,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { ariaLabels } from "@/lib/accessibility-utils"

interface BreadcrumbSegment {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface SmartBreadcrumbsProps {
  className?: string
  maxItems?: number
  showIcons?: boolean
}

// Route configuration with icons and labels
const routeConfig: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  // Main sections
  dashboard: { label: "Dashboard", icon: Home },
  logs: { label: "Daily Logs", icon: ClipboardList },
  commission: { label: "Commission", icon: DollarSign },
  reports: { label: "Reports", icon: BarChart3 },
  admin: { label: "Administration", icon: Settings },
  
  // Log subsections
  create: { label: "Create", icon: Plus },
  review: { label: "Review", icon: CheckCircle },
  
  // Commission subsections
  list: { label: "Track", icon: Eye },
  
  // Reports subsections
  payroll: { label: "Payroll", icon: BarChart3 },
  "my-payroll": { label: "My Payroll", icon: TrendingUp },
  analytics: { label: "Analytics", icon: Activity },
  
  // Admin subsections
  users: { label: "Users", icon: Users },
  "pay-periods": { label: "Pay Periods", icon: Calendar },
  audit: { label: "Audit Trail", icon: FileText },
}

// Function to get user-friendly label for dynamic segments
const getDynamicLabel = (segment: string, pathSegments: string[], index: number): string => {
  // Check if this is a UUID-like ID (common pattern)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    const parentSegment = pathSegments[index - 1]
    switch (parentSegment) {
      case 'logs':
        return 'Log Details'
      case 'users':
        return 'User Details'
      case 'commission':
        return 'Commission Details'
      default:
        return 'Details'
    }
  }
  
  // Check if it's a numeric ID
  if (/^\d+$/.test(segment)) {
    const parentSegment = pathSegments[index - 1]
    switch (parentSegment) {
      case 'logs':
        return `Log #${segment}`
      case 'users':
        return `User #${segment}`
      case 'commission':
        return `Commission #${segment}`
      default:
        return `#${segment}`
    }
  }
  
  // For other dynamic segments, capitalize and format
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Function to determine if a segment is likely dynamic
const isDynamicSegment = (segment: string): boolean => {
  // UUID pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return true
  }
  
  // Numeric ID pattern
  if (/^\d+$/.test(segment)) {
    return true
  }
  
  // Not a known static route
  return !routeConfig[segment]
}

// Function to get icon for dynamic segments
const getDynamicIcon = (segment: string, pathSegments: string[], index: number): React.ComponentType<{ className?: string }> | undefined => {
  if (isDynamicSegment(segment)) {
    const parentSegment = pathSegments[index - 1]
    switch (parentSegment) {
      case 'logs':
        return FileText
      case 'users':
        return User
      case 'commission':
        return DollarSign
      default:
        return undefined
    }
  }
  return undefined
}

export const SmartBreadcrumbs = React.memo(function SmartBreadcrumbs({ 
  className, 
  maxItems = 4, 
  showIcons = true 
}: SmartBreadcrumbsProps) {
  const pathname = usePathname()
  
  // Performance monitoring
  usePerformanceOptimization({
    componentName: 'SmartBreadcrumbs',
    props: { pathname, maxItems, showIcons },
    trackRenderTime: true
  });
  
  const breadcrumbs = React.useMemo(() => {
    // Remove leading slash and split path
    const pathSegments = pathname.replace(/^\//, '').split('/').filter(Boolean)
    
    // If we're on the root or dashboard, show minimal breadcrumbs
    if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
      return [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: showIcons ? Home : undefined,
        }
      ]
    }
    
    const segments: BreadcrumbSegment[] = []
    
    // Always start with Dashboard as root
    segments.push({
      label: "Dashboard",
      href: "/dashboard",
      icon: showIcons ? Home : undefined,
    })
    
    // Build breadcrumbs from path segments
    let currentPath = ""
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      const isLast = index === pathSegments.length - 1
      const config = routeConfig[segment]
      
      if (config) {
        // Known static route
        segments.push({
          label: config.label,
          href: isLast ? undefined : currentPath,
          icon: showIcons ? config.icon : undefined,
        })
      } else {
        // Dynamic or unknown route
        const label = getDynamicLabel(segment, pathSegments, index)
        const icon = showIcons ? getDynamicIcon(segment, pathSegments, index) : undefined
        
        segments.push({
          label,
          href: isLast ? undefined : currentPath,
          icon,
        })
      }
    })
    
    // Limit the number of breadcrumbs shown
    if (segments.length > maxItems) {
      // Keep first (Dashboard) and last few items
      const keepCount = maxItems - 1
      const keptSegments = segments.slice(-keepCount)
      return [segments[0], ...keptSegments]
    }
    
    return segments
  }, [pathname, maxItems, showIcons])
  
  if (breadcrumbs.length <= 1) {
    return null
  }
  
  return (
    <Breadcrumb 
      className={cn("hidden sm:flex", className)}
      aria-label={ariaLabels.navigation.breadcrumb}
    >
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={`${breadcrumb.href || breadcrumb.label}-${index}`}>
            <BreadcrumbItem className={cn(
              "flex items-center gap-1.5",
              index === 0 && "hidden md:flex" // Hide first item on smaller screens
            )}>
              {breadcrumb.href ? (
                <BreadcrumbLink asChild>
                  <Link 
                    href={breadcrumb.href} 
                    className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                    aria-label={`Navigate to ${breadcrumb.label}`}
                  >
                    {breadcrumb.icon && (
                      <breadcrumb.icon 
                        className="h-3.5 w-3.5" 
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">
                      {breadcrumb.label}
                    </span>
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage 
                  className="flex items-center gap-1.5"
                  aria-current="page"
                  aria-label={`Current page: ${breadcrumb.label}`}
                >
                  {breadcrumb.icon && (
                    <breadcrumb.icon 
                      className="h-3.5 w-3.5" 
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">
                    {breadcrumb.label}
                  </span>
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator 
                className={cn(
                  index === 0 && "hidden md:block" // Hide separator after first item on smaller screens
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
});