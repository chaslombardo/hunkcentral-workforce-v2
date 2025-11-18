import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    console.error('Test auth session:', session);

    return NextResponse.json({
      success: true,
      session: session
        ? {
            user: {
              id: session.user?.id,
              email: session.user?.email,
              fullName: session.user?.fullName,
              roles: session.user?.roles,
            },
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
