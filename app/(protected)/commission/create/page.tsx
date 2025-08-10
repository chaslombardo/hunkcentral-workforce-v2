import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSalesUsers } from '@/lib/actions/commission';
import { CommissionForm } from '@/components/features/commission/commission-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CreateCommissionPage() {
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
  const salesUsers = salesUsersResult.success ? salesUsersResult.data || [] : [];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Commission Entry</h1>
        <p className="text-muted-foreground">
          Enter details for a new commission booking that will be matched when the job is completed.
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Commission Entry Details</CardTitle>
            <CardDescription>
              Fill out the form below to create a new commission entry. The entry will automatically 
              match to captain logs when a job with the same Job ID is approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommissionForm 
              salesUsers={salesUsers}
              currentUserId={session.user.id}
            />
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Important Notes:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Job ID must be unique and match exactly what will be entered in the captain&apos;s log</li>
            <li>• Commission entries can only be edited or deleted while in &quot;pending&quot; status</li>
            <li>• Once matched to a completed job, the actual revenue and commission will be calculated automatically</li>
            <li>• Booking accuracy is calculated by comparing estimated vs actual revenue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}