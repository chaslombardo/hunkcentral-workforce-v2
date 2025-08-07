import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has manager or admin role
    if (!session.user.roles?.includes('manager') && !session.user.roles?.includes('admin')) {
      return NextResponse.json({ count: 0 })
    }

    // Count logs with 'submitted' status (awaiting review)
    const count = await prisma.dailyLog.count({
      where: {
        status: 'submitted'
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching pending logs count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}