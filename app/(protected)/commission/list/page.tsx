import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCommissionEntries } from '@/lib/actions/commission';
import { CommissionListWithActions } from '@/components/features/commission/commission-list-with-actions';
import { CommissionAnalytics } from '@/components/features/commission/commission-analytics';
import { CommissionProjections } from '@/components/features/commission/commission-projections';
import { CommissionConflicts } from '@/components/features/commission/commission-conflicts';
import { BrandButton } from '@/components/brand/brand-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function CommissionListPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check if user has permission to view commission entries
  const canViewCommission =
    session.user.roles?.includes('sales') ||
    session.user.roles?.includes('manager') ||
    session.user.roles?.includes('admin') ||
    session.user.commissionRate;

  if (!canViewCommission) {
    redirect('/dashboard');
  }

  // Get commission entries
  const entriesResult = await getCommissionEntries();
  const entries = entriesResult.success ? entriesResult.data || [] : [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-hunks-orange/5 via-background to-hunks-green/5 rounded-lg p-6 border border-hunks-orange/10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-hunks-orange mb-3">
              Commission Tracking
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Track commission entries and their matching status with completed
              jobs.
            </p>
          </div>
          <Link href="/commission/create">
            <BrandButton variant="secondary" size="lg" className="h-12 px-8">
              <Plus className="mr-2 h-5 w-5" />
              Create Entry
            </BrandButton>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="entries" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg h-12">
          <TabsTrigger
            value="entries"
            className="data-[state=active]:bg-hunks-orange data-[state=active]:text-white transition-all duration-300 h-10 text-base"
          >
            Commission Entries
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-hunks-orange data-[state=active]:text-white transition-all duration-300 h-10 text-base"
          >
            Analytics & Trends
          </TabsTrigger>
          <TabsTrigger
            value="projections"
            className="data-[state=active]:bg-hunks-orange data-[state=active]:text-white transition-all duration-300 h-10 text-base"
          >
            Earnings Projections
          </TabsTrigger>
          <TabsTrigger
            value="conflicts"
            className="data-[state=active]:bg-hunks-orange data-[state=active]:text-white transition-all duration-300 h-10 text-base"
          >
            Conflicts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-8">
          <CommissionListWithActions entries={entries} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <CommissionAnalytics entries={entries} />
        </TabsContent>

        <TabsContent value="projections" className="space-y-8">
          <CommissionProjections
            entries={entries}
            currentUserId={session.user.id}
          />
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-8">
          <CommissionConflicts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
