// NextAuth.js configuration
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { getMonitoring } from '@/lib/monitoring';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/types';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          await logAuthError(new Error('Missing credentials'), {
            action: 'login',
            url: req?.headers?.referer || '/auth/login',
            userAgent: req?.headers?.['user-agent'],
            additionalData: {
              email: credentials?.email ? 'provided' : 'missing',
              password: credentials?.password ? 'provided' : 'missing',
            },
          });
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            await logAuthError(new Error('User not found'), {
              action: 'login',
              url: req?.headers?.referer || '/auth/login',
              userAgent: req?.headers?.['user-agent'],
              additionalData: { email: credentials.email },
            });
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            await logAuthError(new Error('Invalid password'), {
              action: 'login',
              userId: user.id,
              url: req?.headers?.referer || '/auth/login',
              userAgent: req?.headers?.['user-agent'],
              additionalData: { email: credentials.email },
            });
            return null;
          }

          // Log successful authentication in development
          // Authentication successful - user logged in

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            fullName: user.fullName,
            roles: user.roles as UserRole[],
            commissionRate: user.commissionRate
              ? Number(user.commissionRate)
              : null,
          };
        } catch (error) {
          await logAuthError(error, {
            action: 'login',
            url: req?.headers?.referer || '/auth/login',
            userAgent: req?.headers?.['user-agent'],
            additionalData: { email: credentials.email },
          });
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
        }

        // Validate token integrity on each request
        if (trigger === 'update' && token?.id) {
          try {
            // Verify user still exists and is active
            const currentUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { id: true, email: true, fullName: true, roles: true },
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
};
