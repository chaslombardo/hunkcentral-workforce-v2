"use client"

import * as React from "react"
import { WifiOff, CloudOff, Cloud, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOffline, useOfflineSync } from "@/hooks/useOffline"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Simple offline indicator for header/navigation
export function OfflineIndicator() {
  const { isOnline, isOffline, hasBeenOffline } = useOffline()
  const { hasPendingSync, pendingSync } = useOfflineSync()

  if (isOnline && !hasBeenOffline && !hasPendingSync) {
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
      
      {isOnline && hasPendingSync && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <CloudOff className="h-3 w-3" />
          Syncing ({pendingSync.length})
        </Badge>
      )}
      
      {isOnline && hasBeenOffline && !hasPendingSync && (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Back Online
        </Badge>
      )}
    </div>
  )
}

// Detailed offline status card
export function OfflineStatusCard() {
  const { isOnline, isOffline, hasBeenOffline } = useOffline()
  const { hasPendingSync, pendingSync, syncData } = useOfflineSync()
  const { toast } = useToast()

  const handleSyncAll = async () => {
    try {
      for (const key of pendingSync) {
        await syncData(key)
      }
      toast({
        title: "Sync Complete",
        description: "All offline data has been synchronized.",
      })
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Some data could not be synchronized. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isOnline && !hasBeenOffline && !hasPendingSync) {
    return null
  }

  return (
    <Card className={cn(
      "mb-4",
      isOffline && "border-destructive",
      isOnline && hasPendingSync && "border-yellow-500",
      isOnline && !hasPendingSync && "border-green-500"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isOffline && (
            <>
              <WifiOff className="h-4 w-4 text-destructive" />
              You&apos;re Offline
            </>
          )}
          {isOnline && hasPendingSync && (
            <>
              <CloudOff className="h-4 w-4 text-yellow-600" />
              Synchronizing Data
            </>
          )}
          {isOnline && !hasPendingSync && hasBeenOffline && (
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
              You can continue working offline. Your changes will be saved locally and synchronized when you&apos;re back online.
            </CardDescription>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some features may be limited while offline. Forms will auto-save locally.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {isOnline && hasPendingSync && (
          <div className="space-y-3">
            <CardDescription>
              Synchronizing {pendingSync.length} item(s) with the server...
            </CardDescription>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Items pending sync: {pendingSync.join(', ')}
              </div>
              <Button size="sm" onClick={handleSyncAll}>
                <Cloud className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </div>
          </div>
        )}
        
        {isOnline && !hasPendingSync && hasBeenOffline && (
          <div className="space-y-3">
            <CardDescription className="text-green-700">
              All your offline changes have been synchronized successfully.
            </CardDescription>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Network status indicator for mobile
export function MobileNetworkIndicator() {
  const { isOnline, isOffline } = useOffline()
  const { hasPendingSync } = useOfflineSync()

  return (
    <div className="fixed top-4 right-4 z-50 md:hidden">
      {isOffline && (
        <Badge variant="destructive" className="flex items-center gap-1 shadow-lg">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
      
      {isOnline && hasPendingSync && (
        <Badge variant="secondary" className="flex items-center gap-1 shadow-lg">
          <CloudOff className="h-3 w-3" />
          Syncing
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