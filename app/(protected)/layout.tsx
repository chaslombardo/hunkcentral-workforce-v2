import { MainLayout } from "@/components/layout/main-layout"
import { EnhancedMobileHeader, MobileQuickActions } from "@/components/layout/mobile-navigation"
import { MobileNetworkIndicator } from "@/components/ui/offline-indicator"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Mobile network indicator */}
      <MobileNetworkIndicator />
      
      {/* Mobile header - only visible on mobile */}
      <div className="md:hidden">
        <EnhancedMobileHeader />
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
      
      {/* Mobile quick actions */}
      <MobileQuickActions />
    </>
  )
}