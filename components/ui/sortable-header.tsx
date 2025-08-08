"use client"

import * as React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableHeaderProps {
  children: React.ReactNode;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  className?: string;
  branded?: boolean;
}

export function SortableHeader({ 
  children, 
  sortDirection, 
  onSort, 
  className,
  branded = false 
}: SortableHeaderProps) {
  const getSortIcon = () => {
    if (sortDirection === 'asc') {
      return <ChevronUp className={cn("h-4 w-4", branded && "text-hunks-green-600")} />
    }
    if (sortDirection === 'desc') {
      return <ChevronDown className={cn("h-4 w-4", branded && "text-hunks-green-600")} />
    }
    return <ChevronsUpDown className={cn("h-4 w-4 opacity-50", branded && "text-hunks-green-400")} />
  }

  return (
    <button
      onClick={onSort}
      className={cn(
        "flex items-center gap-2 hover:text-foreground transition-colors select-none",
        branded && "hover:text-hunks-green-900 text-hunks-green-800",
        className
      )}
    >
      {children}
      {getSortIcon()}
    </button>
  )
}

// Custom sort icons with brand colors
export function BrandSortIcon({ direction, className }: { direction?: 'asc' | 'desc' | null; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn(
        "w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-transparent transition-colors",
        direction === 'asc' ? "border-b-hunks-green-600" : "border-b-hunks-green-300"
      )} />
      <div className={cn(
        "w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent mt-[1px] transition-colors",
        direction === 'desc' ? "border-t-hunks-green-600" : "border-t-hunks-green-300"
      )} />
    </div>
  )
}

// Utility function to get sort direction for TanStack Table
export function getSortDirection(isSorted: false | 'asc' | 'desc'): 'asc' | 'desc' | null {
  if (isSorted === 'asc') return 'asc'
  if (isSorted === 'desc') return 'desc'
  return null
}