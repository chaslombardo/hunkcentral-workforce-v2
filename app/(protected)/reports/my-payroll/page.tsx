import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MyPayrollView } from '@/components/features/reports/my-payroll-view';

export const dynamic = 'force-dynamic'

export default async function MyPayrollPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  return <MyPayrollView userId={session.user.id} />;
}