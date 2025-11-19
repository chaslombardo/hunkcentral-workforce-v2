import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSalesUsers } from '@/lib/actions/commission';
import { CommissionForm } from '@/components/features/commission/commission-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
  const salesUsers = salesUsersResult.success
    ? salesUsersResult.data || []
    : [];

  return (
    <div className="container mx-auto space-y-8 pb-12 pt-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create Commission Entry
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Enter details for a new commission booking that will be matched when
          the job is completed.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">Commission Entry Details</CardTitle>
            <CardDescription className="text-base">
              Fill out the form below to create a new commission entry. The
              entry will automatically match to captain logs when a job with the
              same Job ID is approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommissionForm
              salesUsers={salesUsers}
              currentUserId={session.user.id}
            />
          </CardContent>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="border-l-4 border-l-hunks-green">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Important Notes</CardTitle>
              <CardDescription>
                Keep these requirements in mind before submitting an entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                • Job ID must be unique and match the captain&apos;s log
              </div>
              <div>
                • Entries are editable only while in &quot;pending&quot; status
              </div>
              <div>
                • Once matched, revenue and commission update automatically
              </div>
              <div>• Booking accuracy compares estimated vs actual revenue</div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
