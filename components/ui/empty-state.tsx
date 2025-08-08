"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  } | {
    label: string
    href: string
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 space-y-4",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2">
          {'onClick' in action ? (
            <Button onClick={action.onClick} className="bg-[#026937] hover:bg-[#026937]/90">
              {action.label}
            </Button>
          ) : (
            <Button asChild className="bg-[#026937] hover:bg-[#026937]/90">
              <a href={action.href}>{action.label}</a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}