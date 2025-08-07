import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has sales or admin role
    if (!session.user.roles?.includes('sales') && !session.user.roles?.includes('admin')) {
      return NextResponse.json({ count: 0 })
    }

    // Count commission entries with 'pending' status
    const count = await prisma.commissionEntry.count({
      where: {
        status: 'pending'
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching pending commissions count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}