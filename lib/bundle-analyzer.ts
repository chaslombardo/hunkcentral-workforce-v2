/**
 * Bundle analyzer configuration for optimizing bundle size
 * Run with: ANALYZE=true npm run build
 */

// This file is used by next.config.ts for bundle analysis
export const bundleAnalyzerConfig = {
  // Webpack configuration for tree-shaking optimization
  webpack: (config: unknown, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Enable tree-shaking in production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        // Split chunks for better caching
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            // Separate brand components
            brand: {
              test: /[\\/]components[\\/]brand[\\/]/,
              name: 'brand-components',
              chunks: 'all',
              priority: 10,
            },
            // Separate form components
            forms: {
              test: /[\\/]components[\\/]forms[\\/]/,
              name: 'form-components',
              chunks: 'all',
              priority: 10,
            },
            // Separate UI components
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: 'ui-components',
              chunks: 'all',
              priority: 5,
            },
            // Separate feature components
            features: {
              test: /[\\/]components[\\/]features[\\/]/,
              name: 'feature-components',
              chunks: 'all',
              priority: 5,
            },
          },
        },
      };
    }

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      // Tree-shake lucide-react imports
      'lucide-react': 'lucide-react/dist/esm/icons',
    };

    return config;
  },
};