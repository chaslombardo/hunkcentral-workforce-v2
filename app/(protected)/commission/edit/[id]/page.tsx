import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EditCommissionForm } from '../../../../../components/features/commission/edit-commission-form';

export const metadata: Metadata = {
  title: 'Edit Commission Entry - HUNKCentral',
  description: 'Edit commission entry details',
};

interface EditCommissionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCommissionPage({
  params,
}: EditCommissionPageProps) {
  const { id } = await params;

  try {
    const session = await auth();
    if (!session?.user) {
      notFound();
    }

    // Fetch the commission entry
    const commissionEntry = await prisma.commissionEntry.findUnique({
      where: { id },
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            email: true,
            commissionRate: true,
          },
        },
      },
    });

    if (!commissionEntry) {
      notFound();
    }

    // Check if user can edit this entry
    const isOwner = commissionEntry.salesId === session.user.id;
    const isAdmin = session.user.roles?.includes('admin') || false;
    const isManager = session.user.roles?.includes('manager') || false;

    if (!isOwner && !isAdmin && !isManager) {
      notFound();
    }

    // Can only edit pending entries
    if (commissionEntry.status !== 'pending') {
      throw new Error('Only pending commission entries can be edited');
    }

    // Fetch all sales users for the form
    const salesUsers = await prisma.user.findMany({
      where: {
        roles: {
          hasSome: ['sales', 'admin'],
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        commissionRate: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    // Convert Decimal types to numbers for the form
    const formattedCommissionEntry = {
      ...commissionEntry,
      estimatedRevenue: Number(commissionEntry.estimatedRevenue),
      sales: {
        ...commissionEntry.sales,
        commissionRate: commissionEntry.sales.commissionRate
          ? Number(commissionEntry.sales.commissionRate)
          : null,
      },
    };

    const formattedSalesUsers = salesUsers.map((user) => ({
      ...user,
      commissionRate: user.commissionRate ? Number(user.commissionRate) : null,
    }));

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Commission Entry
          </h1>
          <p className="text-muted-foreground">
            Update commission entry details for job ID {commissionEntry.jobId}
          </p>
        </div>
        <EditCommissionForm
          commissionEntry={formattedCommissionEntry}
          salesUsers={formattedSalesUsers}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading commission entry:', error);
    notFound();
  }
}
