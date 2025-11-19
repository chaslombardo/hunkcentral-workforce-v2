import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import dynamicImport from 'next/dynamic';
import { BrandLoader } from '@/components/ui/brand-loader';

export const dynamic = 'force-dynamic';

// Lazy load the heavy payroll view with loading state
const MyPayrollView = dynamicImport(
  () =>
    import('@/components/features/reports/my-payroll-view').then((mod) => ({
      default: mod.MyPayrollView,
    })),
  {
    loading: () => (
      <BrandLoader label="Loading payroll data..." fullScreen size="lg" />
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
