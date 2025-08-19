import { MainLayout } from "@/components/layout/main-layout"
import { 
  UnifiedMobileHeader, 
  UnifiedBottomNavigation, 
  UnifiedQuickActionsFAB 
} from "@/components/layout/unified-mobile-navigation"
import { MobileNetworkIndicator } from "@/components/ui/offline-indicator"
import { NavigationProvider } from "@/contexts/navigation-context"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { FeedbackDialog } from "@/components/features/feedback/feedback-dialog"
import { ThemeDebug } from "@/components/theme-debug"
import { PageErrorBoundary } from "@/components/ui/page-error-boundary"
import { ProductionErrorBoundary } from "@/components/ui/production-error-boundary"
import { ProductionProtectedRoute } from "@/components/auth/production-protected-route"
import { validateProductionSession } from "@/lib/production-auth"

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Validate session on server-side with enhanced error handling
  const authResult = await validateProductionSession(undefined, {
    requireAuth: true,
    redirectOnFailure: true,
    validateDatabase: true,
    allowGracefulDegradation: true,
  });

  // Extract serializable user data only (no functions)
  const userId = authResult.user?.id;
  
  return (
    <ProductionErrorBoundary 
      level="page" 
      name="protected-layout"
      enableUserFeedback={true}
      enableErrorReporting={true}
    >
      <PageErrorBoundary pageName="protected-layout">
        <ProductionProtectedRoute enableAutoRecovery={true}>
          <NavigationProvider>
            {/* Performance monitoring for all protected pages */}
            <PerformanceMonitor 
              pageName="protected-layout" 
              userId={userId}
              trackInteractions={true}
              trackFormSubmissions={true}
            />
            
            {/* Mobile network indicator */}
            <MobileNetworkIndicator />
            
            {/* Mobile header - only visible on mobile */}
            <div className="md:hidden">
              <UnifiedMobileHeader />
            </div>
            
            {/* Desktop layout with sidebar - hidden on mobile */}
            <div className="hidden md:block">
              <MainLayout>{children}</MainLayout>
            </div>
            
            {/* Mobile content - only visible on mobile */}
            <div className="md:hidden">
              <div className="flex flex-1 flex-col gap-4 p-4 pb-20">
                {children}
              </div>
            </div>
            
            {/* Unified mobile navigation */}
            <UnifiedBottomNavigation />
            <UnifiedQuickActionsFAB />
            
            {/* Global feedback dialog */}
            <FeedbackDialog />
            
            {/* Theme debug component - only in development */}
            <ThemeDebug enabled={process.env.NODE_ENV === 'development'} />
          </NavigationProvider>
        </ProductionProtectedRoute>
      </PageErrorBoundary>
    </ProductionErrorBoundary>
  )
}