// NextAuth.js configuration - placeholder for task 3
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

const authOptions: NextAuthOptions = {
  providers: [
    // Providers will be configured in task 3
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async session({ session, token: _token }) {
      // Session callback will be implemented in task 3
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async jwt({ token, user: _user }) {
      // JWT callback will be implemented in task 3
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
