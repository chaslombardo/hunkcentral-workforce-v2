// NextAuth.js configuration
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { logAuthError } from '@/lib/errorLogger';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/types';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const identifier = credentials?.identifier?.trim();
        const password = credentials?.password;

        if (!identifier || !password) {
          await logAuthError(new Error('Missing credentials'), {
            action: 'login',
            url: req?.headers?.referer || '/auth/login',
            userAgent: req?.headers?.['user-agent'],
            additionalData: {
              identifier: identifier ? 'provided' : 'missing',
              password: password ? 'provided' : 'missing',
            },
          });
          return null;
        }

        try {
          const isEmail = identifier.includes('@');
          const normalizedEmail = identifier.toLowerCase();

          let user = await prisma.user.findUnique({
            where: isEmail
              ? { email: normalizedEmail }
              : { username: identifier },
          });

          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                OR: [{ email: normalizedEmail }, { username: identifier }],
              },
            });
          }

          if (!user) {
            await logAuthError(new Error('User not found'), {
              action: 'login',
              url: req?.headers?.referer || '/auth/login',
              userAgent: req?.headers?.['user-agent'],
              additionalData: { identifier },
            });
            return null;
          }

          if (!user.isActive) {
            await logAuthError(new Error('Account deactivated'), {
              action: 'login',
              userId: user.id,
              url: req?.headers?.referer || '/auth/login',
              userAgent: req?.headers?.['user-agent'],
              additionalData: { identifier },
            });
            throw new Error('account_deactivated');
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            await logAuthError(new Error('Invalid password'), {
              action: 'login',
              userId: user.id,
              url: req?.headers?.referer || '/auth/login',
              userAgent: req?.headers?.['user-agent'],
              additionalData: { identifier },
            });
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            fullName: user.fullName,
            roles: user.roles as UserRole[],
            username: user.username,
            isActive: user.isActive,
            commissionRate: user.commissionRate
              ? Number(user.commissionRate)
              : null,
          };
        } catch (error) {
          await logAuthError(error, {
            action: 'login',
            url: req?.headers?.referer || '/auth/login',
            userAgent: req?.headers?.['user-agent'],
            additionalData: { identifier },
          });
          if (
            error instanceof Error &&
            error.message === 'account_deactivated'
          ) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.fullName = token.fullName as string;
          session.user.roles = token.roles as UserRole[];
          session.user.commissionRate = token.commissionRate as number | null;
          session.user.username = token.username as string | null;
          session.user.isActive = token.isActive as boolean | undefined;
          session.user.originalUserId = token.originalUserId as
            | string
            | undefined;
          session.user.originalFullName = token.originalFullName as
            | string
            | undefined;
          session.user.originalRoles = token.originalRoles as
            | UserRole[]
            | undefined;
          session.user.impersonatedUserId = token.impersonatedUserId as
            | string
            | undefined;
          session.user.impersonatedFullName = token.impersonatedFullName as
            | string
            | undefined;
          session.user.impersonatedRoles = token.impersonatedRoles as
            | UserRole[]
            | undefined;
          session.user.impersonationStartedAt = token.impersonationStartedAt as
            | string
            | undefined;
          session.user.isImpersonating = Boolean(
            token.originalUserId && token.impersonatedUserId
          );
          session.impersonation = {
            isImpersonating: session.user.isImpersonating ?? false,
            originalUserId: session.user.originalUserId,
            originalFullName: session.user.originalFullName,
            targetUserId: session.user.impersonatedUserId,
            targetFullName: session.user.impersonatedFullName,
            startedAt: session.user.impersonationStartedAt,
          };
        }
        return session;
      } catch (error) {
        await logAuthError(error, {
          action: 'session_validation',
          userId: token?.id as string,
          url: '/session',
          additionalData: { tokenExists: !!token, sessionExists: !!session },
        });
        // Return session without modifications on error
        return session;
      }
    },
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          token.id = user.id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.fullName = (user as any).fullName;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.roles = (user as any).roles;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.commissionRate = (user as any).commissionRate;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.username = (user as any).username ?? null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.isActive = (user as any).isActive ?? true;
          delete token.originalUserId;
          delete token.originalFullName;
          delete token.originalRoles;
          delete token.impersonatedUserId;
          delete token.impersonatedFullName;
          delete token.impersonatedRoles;
          delete token.impersonationStartedAt;
        }

        // Validate token integrity on each request
        if (trigger === 'update' && token?.id) {
          try {
            // Verify user still exists and is active
            const currentUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                id: true,
                email: true,
                fullName: true,
                roles: true,
                username: true,
                isActive: true,
                commissionRate: true,
              },
            });

            if (!currentUser) {
              await logAuthError(new Error('User no longer exists'), {
                action: 'session_validation',
                userId: token.id as string,
                url: '/token-validation',
                additionalData: { trigger },
              });
              // Continue with existing token - session callback will handle invalid user
              return token;
            }

            // Update token with current user data
            token.fullName = currentUser.fullName;
            token.roles = currentUser.roles as UserRole[];
            token.username = currentUser.username;
            token.isActive = currentUser.isActive;
            token.commissionRate = currentUser.commissionRate
              ? Number(currentUser.commissionRate)
              : null;
          } catch (dbError) {
            await logAuthError(dbError, {
              action: 'session_validation',
              userId: token.id as string,
              url: '/token-validation',
              additionalData: { trigger, error: 'database_check_failed' },
            });
            // Continue with existing token if database check fails
          }
        }

        return token;
      } catch (error) {
        await logAuthError(error, {
          action: 'session_validation',
          userId: token?.id as string,
          url: '/jwt',
          additionalData: { trigger, userExists: !!user },
        });
        // Return existing token to avoid breaking session
        return token;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
