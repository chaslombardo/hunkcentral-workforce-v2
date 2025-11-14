'use client';

import { BrandLoading } from './brand-loading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function BrandLoadingDemo() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-hunks-green mb-2">
          Brand Loading Components
        </h2>
        <p className="text-muted-foreground">
          Loading indicators using College Hunks brand colors with support for
          reduced motion preferences.
        </p>
      </div>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Variants</CardTitle>
          <CardDescription>
            Different animation styles for various contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Spinner</h4>
            <div className="flex items-center gap-4">
              <BrandLoading variant="spinner" color="primary" />
              <BrandLoading variant="spinner" color="secondary" />
              <BrandLoading variant="spinner" color="muted" />
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Dots</h4>
            <div className="flex items-center gap-4">
              <BrandLoading variant="dots" color="primary" />
              <BrandLoading variant="dots" color="secondary" />
              <BrandLoading variant="dots" color="muted" />
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Pulse</h4>
            <div className="flex items-center gap-4">
              <BrandLoading variant="pulse" color="primary" />
              <BrandLoading variant="pulse" color="secondary" />
              <BrandLoading variant="pulse" color="muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Size Variants</CardTitle>
          <CardDescription>
            Different sizes for various UI contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Small (sm)</h4>
            <div className="flex items-center gap-4">
              <BrandLoading variant="spinner" size="sm" color="primary" />
              <BrandLoading variant="dots" size="sm" color="primary" />
              <BrandLoading variant="pulse" size="sm" color="primary" />
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Medium (md) - Default</h4>
            <div className="flex items-center gap-4">
              <BrandLoading variant="spinner" size="md" color="primary" />
              <BrandLoading variant="dots" size="md" color="primary" />
              <BrandLoading variant="pulse" size="md" color="primary" />
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Large (lg)</h4>
            <div className="flex items-center gap-4">
              <BrandLoading variant="spinner" size="lg" color="primary" />
              <BrandLoading variant="dots" size="lg" color="primary" />
              <BrandLoading variant="pulse" size="lg" color="primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* With Text */}
      <Card>
        <CardHeader>
          <CardTitle>With Text Labels</CardTitle>
          <CardDescription>
            Loading indicators with descriptive text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BrandLoading
            variant="spinner"
            color="primary"
            text="Loading dashboard..."
          />
          <BrandLoading
            variant="dots"
            color="secondary"
            text="Processing payroll..."
          />
          <BrandLoading
            variant="pulse"
            color="muted"
            text="Saving changes..."
          />
        </CardContent>
      </Card>

      {/* Dark Background Examples */}
      <Card className="bg-hunks-green text-white">
        <CardHeader>
          <CardTitle className="text-white">On Dark Backgrounds</CardTitle>
          <CardDescription className="text-white/80">
            White loading indicators for dark backgrounds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <BrandLoading variant="spinner" color="white" />
            <BrandLoading variant="dots" color="white" />
            <BrandLoading variant="pulse" color="white" />
          </div>
          <BrandLoading variant="spinner" color="white" text="Loading..." />
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Common Usage Examples</CardTitle>
          <CardDescription>Real-world usage scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Button Loading States</h4>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-hunks-green text-white rounded-md disabled:opacity-50"
                disabled
              >
                <BrandLoading variant="spinner" size="sm" color="white" />
                Submitting...
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-hunks-orange text-white rounded-md disabled:opacity-50"
                disabled
              >
                <BrandLoading variant="dots" size="sm" color="white" />
                Processing...
              </button>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Page Loading</h4>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted rounded-lg">
              <BrandLoading
                variant="spinner"
                size="lg"
                color="primary"
                text="Loading dashboard data..."
              />
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Inline Loading</h4>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                Calculating payroll
                <BrandLoading variant="dots" size="sm" color="primary" />
              </p>
              <p className="flex items-center gap-2">
                Matching commissions
                <BrandLoading variant="pulse" size="sm" color="secondary" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
