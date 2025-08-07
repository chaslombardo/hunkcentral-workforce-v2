import { MainLayout } from "@/components/layout/main-layout"
import { 
  UnifiedMobileHeader, 
  UnifiedBottomNavigation, 
  UnifiedQuickActionsFAB 
} from "@/components/layout/unified-mobile-navigation"
import { MobileNetworkIndicator } from "@/components/ui/offline-indicator"
import { NavigationProvider } from "@/contexts/navigation-context"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NavigationProvider>
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
    </NavigationProvider>
  )
}