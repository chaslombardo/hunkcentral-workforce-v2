import { redirect } from 'next/navigation';
import { auth, hasRole } from '@/lib/auth';
import RankingsClient from '@/components/features/reports/rankings-client';

export default async function RankingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // All authenticated users can access rankings report (per requirements)
  const isCurrentUserCaptain = hasRole(session.user, 'captain');

  return (
    <RankingsClient
      currentUserId={session.user.id}
      isCurrentUserCaptain={isCurrentUserCaptain}
    />
  );
}
