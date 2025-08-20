import NextAuth from 'next-auth';
import type { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      fullName: string;
      roles: UserRole[];
      commissionRate?: number | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    fullName: string;
    roles: UserRole[];
    commissionRate?: number | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    fullName: string;
    roles: UserRole[];
    commissionRate?: number | null;
  }
}
