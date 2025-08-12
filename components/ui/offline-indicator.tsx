"use client"

import * as React from "react"
import { WifiOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOffline } from "@/hooks/useOffline"
import { cn } from "@/lib/utils"

// Simple offline indicator for header/navigation - simplified to remove sync confusion
export function OfflineIndicator() {
  const { isOnline, isOffline, hasBeenOffline } = useOffline()

  if (isOnline && !hasBeenOffline) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {isOffline && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
      
      {isOnline && hasBeenOffline && (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Back Online
        </Badge>
      )}
    </div>
  )
}

// Detailed offline status card - simplified to remove sync confusion
export function OfflineStatusCard() {
  const { isOnline, isOffline, hasBeenOffline } = useOffline()

  // Only show status when offline or recently back online
  if (isOnline && !hasBeenOffline) {
    return null
  }

  return (
    <Card className={cn(
      "mb-4",
      isOffline && "border-destructive",
      isOnline && hasBeenOffline && "border-green-500"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isOffline && (
            <>
              <WifiOff className="h-4 w-4 text-destructive" />
              You&apos;re Offline
            </>
          )}
          {isOnline && hasBeenOffline && (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Back Online
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOffline && (
          <div className="space-y-3">
            <CardDescription>
              You can continue working offline. Use the &quot;Save Draft&quot; button to save your work locally.
            </CardDescription>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some features may be limited while offline. Your drafts will be available when you&apos;re back online.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {isOnline && hasBeenOffline && (
          <div className="space-y-3">
            <CardDescription className="text-green-700">
              You&apos;re back online. Your saved drafts are available.
            </CardDescription>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Network status indicator for mobile - simplified to remove sync confusion
export function MobileNetworkIndicator() {
  const { isOffline } = useOffline()

  return (
    <div className="fixed top-4 right-4 z-50 md:hidden">
      {isOffline && (
        <Badge variant="destructive" className="flex items-center gap-1 shadow-lg">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
    </div>
  )
}

// Connection quality indicator
export function ConnectionQualityIndicator() {
  const [connectionType, setConnectionType] = React.useState<string>('unknown')
  const [isSlowConnection, setIsSlowConnection] = React.useState(false)

  React.useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection: { effectiveType: string; addEventListener: (event: string, handler: () => void) => void; removeEventListener: (event: string, handler: () => void) => void } }).connection
      setConnectionType(connection.effectiveType || 'unknown')
      setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType))

      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown')
        setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType))
      }

      connection.addEventListener('change', handleConnectionChange)
      return () => connection.removeEventListener('change', handleConnectionChange)
    }
  }, [])

  if (!isSlowConnection) {
    return null
  }

  return (
    <Alert className="mb-4 border-yellow-500">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Slow connection detected ({connectionType}). Some features may load slowly.
      </AlertDescription>
    </Alert>
  )
}