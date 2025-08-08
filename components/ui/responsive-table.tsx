"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  minWidth?: string;
  branded?: boolean;
}

export function ResponsiveTable({ 
  children, 
  className, 
  minWidth = "800px",
  branded = false,
  ...props 
}: ResponsiveTableProps) {
  return (
    <div 
      className={cn(
        "w-full overflow-x-auto rounded-lg border",
        branded && "border-hunks-green-200",
        className
      )}
      {...props}
    >
      <div style={{ minWidth }} className="w-full">
        {children}
      </div>
    </div>
  )
}

interface MobileTableCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileTableCard({ children, className }: MobileTableCardProps) {
  return (
    <div className={cn(
      "block md:hidden space-y-4",
      className
    )}>
      {children}
    </div>
  )
}

interface MobileTableItemProps {
  children: React.ReactNode;
  className?: string;
  branded?: boolean;
}

export function MobileTableItem({ children, className, branded = false }: MobileTableItemProps) {
  return (
    <div className={cn(
      "p-4 border rounded-lg space-y-2",
      branded && "border-hunks-green-200 bg-hunks-green-50/30",
      className
    )}>
      {children}
    </div>
  )
}

interface MobileTableFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileTableField({ label, value, className }: MobileTableFieldProps) {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

// Hook for responsive table behavior
export function useResponsiveTable() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return { isMobile }
}