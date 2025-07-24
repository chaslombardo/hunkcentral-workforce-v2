import { MainLayout } from "@/components/layout/main-layout"
import { MobileHeader } from "@/components/layout/mobile-header"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Mobile header - only visible on mobile */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      {/* Desktop layout with sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <MainLayout>{children}</MainLayout>
      </div>
      
      {/* Mobile content - only visible on mobile */}
      <div className="md:hidden">
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </div>
    </>
  )
}