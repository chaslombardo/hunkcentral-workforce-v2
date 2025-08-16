import type { NextConfig } from 'next';
import { productionWebpackConfig } from './next.config.production';

const nextConfig: NextConfig = {
  // Vercel-specific optimizations
  poweredByHeader: false,
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@/components/ui', 'lucide-react', '@/components/brand', '@/components/forms'],
  },
  
  // External packages that should not be bundled for client-side
  serverExternalPackages: ['@prisma/client'],
  
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },
  
  // PWA and offline support
  async rewrites() {
    return [
      {
        source: '/offline',
        destination: '/offline'
      }
    ];
  },
  
  // Only add webpack configuration for production builds
  // Development uses Turbopack which handles optimizations automatically
  ...(process.env.NODE_ENV === 'production' && {
    webpack: productionWebpackConfig,
  }),
};

export default nextConfig;
