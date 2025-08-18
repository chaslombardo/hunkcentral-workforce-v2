import type { NextConfig } from 'next';
import { productionWebpackConfig } from './next.config.production';

const nextConfig: NextConfig = {
  // Vercel-specific optimizations
  poweredByHeader: false,
  
  // Performance optimizations
  experimental: {
    // Comprehensive package import optimization for better tree-shaking
    optimizePackageImports: [
      // Local component libraries
      '@/components/ui', 
      '@/components/brand', 
      '@/components/forms',
      
      // Heavy icon libraries (major bundle size impact)
      'lucide-react', 
      '@tabler/icons-react',
      
      // Heavy chart/table libraries
      'recharts',
      '@tanstack/react-table',
      
      // Date libraries
      'date-fns',
      'react-day-picker',
      
      // Authentication
      'next-auth',
      'next-auth/react',
      
      // All Radix UI packages for comprehensive optimization
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-form',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-resizable-panels',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-sheet',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-slot',
      '@radix-ui/react-primitive',
      '@radix-ui/react-visually-hidden',
      
      // Drag and drop
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      
      // Utility libraries
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
      'react-hook-form',
    ],
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
