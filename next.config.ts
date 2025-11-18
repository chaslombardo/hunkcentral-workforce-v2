import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,

  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@tabler/icons-react',
      'lucide-react',
      'react-hook-form',
      'recharts',
      'date-fns',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
    ],
  },

  serverExternalPackages: ['@prisma/client'],

  compress: true,

  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source:
          '/((?!_next/static|favicon\\.ico|manifest\\.json|sw\\.js|icon-.*\\.png).*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
