"use client"

import * as React from "react"
import { SmartBreadcrumbs } from "./smart-breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function SmartBreadcrumbsDemo() {
  const demoRoutes = [
    { path: "/dashboard", description: "Dashboard root" },
    { path: "/logs", description: "Logs listing" },
    { path: "/logs/create", description: "Create new log" },
    { path: "/logs/123", description: "Log details (numeric ID)" },
    { path: "/logs/550e8400-e29b-41d4-a716-446655440000", description: "Log details (UUID)" },
    { path: "/commission/create", description: "Create commission" },
    { path: "/commission/list", description: "Commission tracking" },
    { path: "/reports/payroll", description: "Payroll reports" },
    { path: "/reports/my-payroll", description: "Personal payroll" },
    { path: "/admin/users", description: "User management" },
    { path: "/admin/users/456", description: "User details" },
    { path: "/admin/pay-periods", description: "Pay periods" },
    { path: "/admin/audit", description: "Audit trail" },
  ]

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Smart Breadcrumbs Demo</CardTitle>
        <CardDescription>
          Test the smart breadcrumb system with different route patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current Breadcrumbs:</h3>
          <div className="border rounded-lg p-4 bg-muted/50">
            <SmartBreadcrumbs />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Test Routes:</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {demoRoutes.map((route) => (
              <Button
                key={route.path}
                variant="outline"
                size="sm"
                asChild
                className="justify-start h-auto p-3"
              >
                <Link href={route.path}>
                  <div className="text-left">
                    <div className="font-mono text-xs">{route.path}</div>
                    <div className="text-xs text-muted-foreground">{route.description}</div>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Features:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Dynamic path generation from URL segments</li>
            <li>• Support for parameterized routes (IDs, UUIDs)</li>
            <li>• Icons for better visual hierarchy</li>
            <li>• Responsive design (hides first item on smaller screens)</li>
            <li>• Truncated labels for long text</li>
            <li>• Configurable maximum items</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}