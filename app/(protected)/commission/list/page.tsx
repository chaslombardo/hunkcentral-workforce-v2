import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCommissionEntries } from '@/lib/actions/commission';
import { CommissionList } from '@/components/features/commission/commission-list';
import { Button } from '@/components/ui/button';
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Tracking</h1>
          <p className="text-muted-foreground">
            Track commission entries and their matching status with completed jobs.
          </p>
        </div>
        <Link href="/commission/create">
          <Button className="bg-[#026937] hover:bg-[#026937]/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Entry
          </Button>
        </Link>
      </div>

      <CommissionList 
        entries={entries}
        onEdit={() => {
          // TODO: Implement edit functionality in a future task
        }}
        onDelete={() => {
          // TODO: Implement delete functionality in a future task
        }}
        onView={() => {
          // TODO: Implement view details functionality in a future task
        }}
      />
    </div>
  );
}