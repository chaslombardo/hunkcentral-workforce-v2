import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decode, encode, type JWT } from 'next-auth/jwt';
import { logAuthError } from '@/lib/errorLogger';
import type { UserRole } from '@/types';

const SESSION_COOKIE_CANDIDATES = [
  '__Secure-next-auth.session-token',
  '__Host-next-auth.session-token',
  'next-auth.session-token',
];

async function getSessionCookie() {
  const store = await cookies();
  for (const name of SESSION_COOKIE_CANDIDATES) {
    const cookie = store.get(name);
    if (cookie?.value) {
      return { name, value: cookie.value };
    }
  }
  return null;
}

async function writeSessionToken(cookieName: string, payload: JWT) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }

  const maxAge = authOptions.session?.maxAge ?? 60 * 60 * 24;
  const token = await encode({ token: payload, secret, maxAge });

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
}

function sanitizeTokenPayload(token: JWT): JWT {
  const sanitized = { ...token };
  delete sanitized.exp;
  delete sanitized.iat;
  delete sanitized.jti;
  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actingRoles =
      session.user.originalRoles && session.user.originalRoles.length > 0
        ? session.user.originalRoles
        : session.user.roles;

    if (!actingRoles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        {
          status: 403,
        }
      );
    }

    const body = await request.json().catch(() => null);
    const targetUserId = body?.targetUserId as string | undefined;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId is required' },
        { status: 400 }
      );
    }

    const impersonatorId = session.user.originalUserId || session.user.id;

    if (targetUserId === session.user.impersonatedUserId) {
      return NextResponse.json(
        { error: 'Already viewing as this user' },
        { status: 400 }
      );
    }

    if (targetUserId === impersonatorId) {
      return NextResponse.json(
        { error: 'You are already using your primary account' },
        { status: 400 }
      );
    }

    const [targetUser, impersonator] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          roles: true,
          isActive: true,
          commissionRate: true,
          permissions: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: impersonatorId },
        select: {
          id: true,
          fullName: true,
          roles: true,
        },
      }),
    ]);

    if (!impersonator || !impersonator.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        {
          status: 403,
        }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    if (!targetUser.isActive) {
      return NextResponse.json(
        { error: 'Target user is inactive' },
        { status: 400 }
      );
    }

    const sessionCookie = await getSessionCookie();
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Session cookie not found' },
        { status: 400 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not configured');
    }

    const decoded = await decode({
      token: sessionCookie.value,
      secret,
    });

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 400 }
      );
    }

    const payload = sanitizeTokenPayload({
      ...decoded,
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.fullName,
      username: targetUser.username,
      roles: targetUser.roles as UserRole[],
      isActive: targetUser.isActive,
      commissionRate: targetUser.commissionRate
        ? Number(targetUser.commissionRate)
        : null,
      permissions: targetUser.permissions,
      originalUserId: session.user.originalUserId || impersonator.id,
      originalFullName: session.user.originalFullName || impersonator.fullName,
      originalRoles:
        (session.user.originalRoles as UserRole[] | undefined) ||
        (impersonator.roles as UserRole[]),
      impersonatedUserId: targetUser.id,
      impersonatedFullName: targetUser.fullName,
      impersonatedRoles: targetUser.roles as UserRole[],
      impersonationStartedAt: new Date().toISOString(),
    });

    await writeSessionToken(sessionCookie.name, payload);

    await prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: targetUser.id,
        action: 'impersonation_start',
        changes: {
          impersonatorId,
          targetUserId,
        },
        userId: impersonatorId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await logAuthError(error, {
      action: 'impersonation_start',
      url: '/api/admin/impersonate',
      additionalData: { method: 'POST' },
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start impersonation',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.originalUserId) {
      return NextResponse.json(
        { error: 'No impersonation session to end' },
        { status: 400 }
      );
    }

    const sessionCookie = await getSessionCookie();
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Session cookie not found' },
        { status: 400 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not configured');
    }

    const decoded = await decode({
      token: sessionCookie.value,
      secret,
    });

    if (!decoded?.originalUserId) {
      return NextResponse.json(
        { error: 'No impersonation session to end' },
        { status: 400 }
      );
    }

    const originalUser = await prisma.user.findUnique({
      where: { id: decoded.originalUserId as string },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        roles: true,
        isActive: true,
        commissionRate: true,
        permissions: true,
      },
    });

    if (!originalUser) {
      return NextResponse.json(
        { error: 'Original user not found' },
        { status: 404 }
      );
    }

    const payload = sanitizeTokenPayload({
      ...decoded,
      id: originalUser.id,
      email: originalUser.email,
      fullName: originalUser.fullName,
      username: originalUser.username,
      roles: originalUser.roles as UserRole[],
      isActive: originalUser.isActive,
      commissionRate: originalUser.commissionRate
        ? Number(originalUser.commissionRate)
        : null,
      permissions: originalUser.permissions,
    });

    delete payload.originalUserId;
    delete payload.originalFullName;
    delete payload.originalRoles;
    delete payload.impersonatedUserId;
    delete payload.impersonatedFullName;
    delete payload.impersonatedRoles;
    delete payload.impersonationStartedAt;

    await writeSessionToken(sessionCookie.name, payload);

    await prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: originalUser.id,
        action: 'impersonation_end',
        changes: {
          originalUserId: originalUser.id,
          endedAt: new Date().toISOString(),
        },
        userId: originalUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await logAuthError(error, {
      action: 'impersonation_end',
      url: '/api/admin/impersonate',
      additionalData: { method: 'DELETE' },
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to stop impersonation',
      },
      { status: 500 }
    );
  }
}
