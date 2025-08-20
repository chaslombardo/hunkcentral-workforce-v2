import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UserDetailView } from '@/components/features/admin/user-detail-view';
import { getUserById } from '@/lib/actions/users';

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: UserDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getUserById(id);

  if (!result.success || !result.user) {
    return {
      title: 'User Not Found | HUNKCentral',
    };
  }

  return {
    title: `${result.user.fullName} | User Details | HUNKCentral`,
    description: `View detailed information for ${result.user.fullName}`,
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const result = await getUserById(id);

  if (!result.success || !result.user) {
    notFound();
  }

  return <UserDetailView user={result.user} />;
}
