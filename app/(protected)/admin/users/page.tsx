import { Metadata } from 'next';
import { UserManagementDashboard } from '@/components/features/admin/user-management-dashboard';

export const metadata: Metadata = {
  title: 'User Management | HUNKCentral',
  description: 'Manage employee accounts, roles, and compensation settings',
};

export const dynamic = 'force-dynamic'

export default function UsersPage() {
  return <UserManagementDashboard />;
}