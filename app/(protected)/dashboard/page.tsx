'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSession } from '@/hooks/useSession';
import { CaptainDashboard } from '@/components/features/dashboard/captain-dashboard';
import { WingmanDashboard } from '@/components/features/dashboard/wingman-dashboard';
import { ManagerDashboard } from '@/components/features/dashboard/manager-dashboard';
import { SalesDashboard } from '@/components/features/dashboard/sales-dashboard';
import { AdminDashboard } from '@/components/features/dashboard/admin-dashboard';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user } = useSession();

  // Determine which dashboard to show based on user roles
  const renderDashboard = () => {
    if (!user?.roles) {
      return <div>Loading...</div>;
    }

    // Priority order: Admin > Manager > Sales > Captain > Wingman
    if (user.roles.includes('admin')) {
      return <AdminDashboard />;
    } else if (user.roles.includes('manager')) {
      return <ManagerDashboard />;
    } else if (user.roles.includes('sales')) {
      return <SalesDashboard />;
    } else if (user.roles.includes('captain')) {
      return <CaptainDashboard />;
    } else if (user.roles.includes('wingman')) {
      return <WingmanDashboard />;
    } else {
      // Default fallback for other roles
      return <WingmanDashboard />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-hunks-green/5 via-background to-hunks-orange/5 rounded-lg p-6 border border-hunks-green/10">
          <h1 className="text-4xl font-bold tracking-tight text-hunks-green mb-3">
            Welcome back, {user?.fullName || 'User'}!
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Here&apos;s what&apos;s happening with your workforce today.
          </p>
        </div>

        {/* Role-specific dashboard using dashboard-01 block structure */}
        {renderDashboard()}
      </div>
    </ProtectedRoute>
  );
}
