/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@tabler/icons-react',
      'lucide-react',
      'recharts',
    ],
  },

  // Prevent server-only packages from being bundled for client
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'bcryptjs',
    'crypto',
    'fs',
    'path',
    'os',
    'fs/promises',
    'stream',
    'util',
    'buffer',
    'events',
    'url',
    'querystring',
    'http',
    'https',
    'zlib',
    'server-only',
  ],

  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@tabler/icons-react',
      'lucide-react',
      'recharts',
    ],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        child_process: false,
        module: false,
        os: false,
        path: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        zlib: false,
      };

      // Exclude Prisma and other server-only modules from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        prisma: 'commonjs prisma',
        bcryptjs: 'commonjs bcryptjs',
        crypto: 'crypto',
        fs: 'fs',
        path: 'path',
        os: 'os',
        'fs/promises': 'fs/promises',
      });
    }

    // Bundle analyzer (only in development)
    if (process.env.ANALYZE === 'true' && !isServer) {
      // Dynamic import to avoid ESLint error
      const BundleAnalyzerPlugin = eval('require')(
        'webpack-bundle-analyzer'
      ).BundleAnalyzerPlugin;
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: '../bundle-analysis.html',
        })
      );
    }

    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects for legacy URLs
  async redirects() {
    return [
      // Add any legacy URL redirects here
    ];
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. Only enable this if you know what you're doing.
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Only enable this if you know what you're doing.
    ignoreDuringBuilds: false,
  },

  // Output configuration for different deployment targets
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;
