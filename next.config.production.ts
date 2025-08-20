import type { NextConfig } from 'next';

// Production-specific webpack optimizations
// This file is used only for production builds to avoid Turbopack conflicts
export const productionWebpackConfig = (
  config: any,
  { isServer }: { isServer: boolean }
) => {
  // Enable tree-shaking in production
  if (!isServer) {
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
      // Split chunks for better caching
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // High-priority: Split out icon libraries to avoid loading all icons
          icons: {
            test: /[\\/]node_modules[\\/](lucide-react|@tabler[\\/]icons-react)[\\/]/,
            name: 'icons',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
            enforce: true,
          },
          // High-priority: Split out charts library (recharts is heavy)
          charts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
            enforce: true,
          },
          // High-priority: Split out table library (@tanstack/react-table)
          table: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]react-table[\\/]/,
            name: 'table',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Medium-priority: Split out Radix UI components
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Medium-priority: Split out drag-and-drop components
          dnd: {
            test: /[\\/]node_modules[\\/]@dnd-kit[\\/]/,
            name: 'dnd',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Medium-priority: Split out date utilities
          date: {
            test: /[\\/]node_modules[\\/](date-fns|react-day-picker)[\\/]/,
            name: 'date',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Lower-priority: Separate brand components
          brand: {
            test: /[\\/]components[\\/]brand[\\/]/,
            name: 'brand-components',
            chunks: 'all',
            priority: 10,
          },
          // Lower-priority: Separate form components
          forms: {
            test: /[\\/]components[\\/]forms[\\/]/,
            name: 'form-components',
            chunks: 'all',
            priority: 10,
          },
          // Lower-priority: Separate UI components
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            chunks: 'all',
            priority: 5,
          },
          // React and core libraries (very high priority)
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Next.js framework code
          framework: {
            test: /[\\/]node_modules[\\/]@?next[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 35,
            reuseExistingChunk: true,
          },
          // Authentication libraries
          auth: {
            test: /[\\/]node_modules[\\/](next-auth|@auth)[\\/]/,
            name: 'auth',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Utility libraries
          utils: {
            test: /[\\/]node_modules[\\/](clsx|class-variance-authority|tailwind-merge|lodash|lodash-es)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Remaining vendor chunks (much smaller now)
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 1, // Lowest priority so it gets what's left
            minSize: 0,
            maxSize: 250000, // 250kb max for vendor chunks
          },
        },
      },
    };
  }

  // Bundle analyzer (only for production builds)
  if (process.env.ANALYZE === 'true') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
        reportFilename: '../bundle-analysis.html',
      })
    );
  }

  return config;
};
