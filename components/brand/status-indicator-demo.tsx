/**
 * StatusIndicator Demo Component
 * 
 * Demonstrates the usage of the StatusIndicator component with various
 * status types, sizes, and configurations.
 */

import React from "react";
import { StatusIndicator, StatusIndicators, type StatusType } from "./status-indicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const allStatuses: StatusType[] = [
  'pending',
  'approved', 
  'matched',
  'rejected',
  'open',
  'locked',
  'closed',
  'active',
  'inactive',
  'success',
  'warning',
  'error',
  'info',
  'processing',
  'draft',
  'submitted',
  'completed'
];

export default function StatusIndicatorDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Status Indicator System</h2>
        <p className="text-muted-foreground">
          Enhanced status indicators built on shadcn/ui Badge with College Hunks brand theming.
        </p>
      </div>

      {/* All Status Types */}
      <Card>
        <CardHeader>
          <CardTitle>All Status Types</CardTitle>
          <CardDescription>
            Complete set of available status indicators with brand colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allStatuses.map((status) => (
              <StatusIndicator key={status} status={status} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Size Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Size Variants</CardTitle>
          <CardDescription>
            Different sizes for various UI contexts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-16 text-sm font-medium">Small:</span>
              <div className="flex gap-2">
                <StatusIndicator status="approved" size="sm" />
                <StatusIndicator status="pending" size="sm" />
                <StatusIndicator status="error" size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-16 text-sm font-medium">Medium:</span>
              <div className="flex gap-2">
                <StatusIndicator status="approved" size="md" />
                <StatusIndicator status="pending" size="md" />
                <StatusIndicator status="error" size="md" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-16 text-sm font-medium">Large:</span>
              <div className="flex gap-2">
                <StatusIndicator status="approved" size="lg" />
                <StatusIndicator status="pending" size="lg" />
                <StatusIndicator status="error" size="lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animated States */}
      <Card>
        <CardHeader>
          <CardTitle>Animated States</CardTitle>
          <CardDescription>
            Processing and pending states with animations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <StatusIndicator status="processing" animated />
            <StatusIndicator status="pending" animated />
            <StatusIndicator status="processing" animated size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Custom Text */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Text</CardTitle>
          <CardDescription>
            Override default status text with custom labels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <StatusIndicator status="approved" text="Commission Approved" />
            <StatusIndicator status="pending" text="Awaiting Review" />
            <StatusIndicator status="matched" text="Auto-Matched" />
            <StatusIndicator status="processing" text="Calculating..." animated />
          </div>
        </CardContent>
      </Card>

      {/* Without Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Text Only</CardTitle>
          <CardDescription>
            Status indicators without icons for compact layouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <StatusIndicator status="approved" showIcon={false} />
            <StatusIndicator status="pending" showIcon={false} />
            <StatusIndicator status="rejected" showIcon={false} />
            <StatusIndicator status="processing" showIcon={false} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Pre-configured Components */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-configured Components</CardTitle>
          <CardDescription>
            Ready-to-use status indicators for common scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium">Commission:</span>
              <div className="flex gap-2">
                <StatusIndicators.Pending />
                <StatusIndicators.Matched />
                <StatusIndicators.Approved />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium">Pay Period:</span>
              <div className="flex gap-2">
                <StatusIndicator status="open" />
                <StatusIndicator status="locked" />
                <StatusIndicator status="closed" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium">General:</span>
              <div className="flex gap-2">
                <StatusIndicators.Success />
                <StatusIndicators.Warning />
                <StatusIndicators.Error />
                <StatusIndicators.Processing />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage in Context */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How status indicators appear in typical application contexts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table-like layout */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Daily Log #1234</div>
                  <div className="text-sm text-muted-foreground">Captain: John Smith</div>
                </div>
                <StatusIndicator status="pending" text="Awaiting Review" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Commission Entry #5678</div>
                  <div className="text-sm text-muted-foreground">Sales: Jane Doe</div>
                </div>
                <StatusIndicator status="matched" text="Auto-Matched" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Pay Period: Jan 2024</div>
                  <div className="text-sm text-muted-foreground">15 employees</div>
                </div>
                <StatusIndicator status="locked" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}