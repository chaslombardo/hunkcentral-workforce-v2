'use client'

import { Building2, WifiOff, RefreshCw } from 'lucide-react'
import { BrandButton } from '@/components/brand/brand-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex aspect-square size-16 items-center justify-center rounded-lg bg-[#026937] text-white">
              <Building2 className="size-8" />
            </div>
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <WifiOff className="h-5 w-5 text-muted-foreground" />
            You&apos;re Offline
          </CardTitle>
          <CardDescription>
            HUNKCentral requires an internet connection to function properly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>While you&apos;re offline, you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Continue working on forms (they&apos;ll save locally)</li>
              <li>View previously loaded content</li>
              <li>Access cached pages</li>
            </ul>
            <p className="mt-3">
              Your changes will automatically sync when you&apos;re back online.
            </p>
          </div>
          
          <BrandButton 
            onClick={() => window.location.reload()} 
            variant="primary"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </BrandButton>
          
          <div className="text-center">
            <BrandButton 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-sm"
            >
              Go Back
            </BrandButton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}