import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSalesUsers } from '@/lib/actions/commission';
import { BulkCommissionForm } from '@/components/features/commission/bulk-commission-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function BulkCommissionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check if user has permission to create commission entries
  const canCreateCommission =
    session.user.roles?.includes('sales') ||
    session.user.roles?.includes('manager') ||
    session.user.roles?.includes('admin') ||
    session.user.commissionRate;

  if (!canCreateCommission) {
    redirect('/dashboard');
  }

  // Get sales users for the selector
  const salesUsersResult = await getSalesUsers();
  const salesUsers = salesUsersResult.success
    ? salesUsersResult.data || []
    : [];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Bulk Commission Entry
        </h1>
        <p className="text-muted-foreground">
          Quickly enter multiple commission entries in a table format. Perfect
          for batch data entry from calls or other sources.
        </p>
      </div>

      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Commission Entry</CardTitle>
            <CardDescription>
              Enter multiple commission entries at once. Each entry will be
              validated and saved individually with proper error reporting for
              any failed entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkCommissionForm
              salesUsers={salesUsers}
              currentUserId={session.user.id}
            />
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Bulk Entry Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use Tab key to navigate between fields efficiently</li>
            <li>• Press Enter to save current row and move to next one</li>
            <li>• All validation rules apply to bulk entries</li>
            <li>• Failed entries will be highlighted with error messages</li>
            <li>• You can edit entries before final submission</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
