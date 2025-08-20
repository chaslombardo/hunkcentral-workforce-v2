import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

// Lazy load the heavy payroll view with loading state
const MyPayrollView = dynamicImport(
  () =>
    import('@/components/features/reports/my-payroll-view').then((mod) => ({
      default: mod.MyPayrollView,
    })),
  {
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <span className="text-sm text-muted-foreground">
            Loading payroll data...
          </span>
        </div>
      </div>
    ),
  }
);

export default async function MyPayrollPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return <MyPayrollView userId={session.user.id} />;
}
