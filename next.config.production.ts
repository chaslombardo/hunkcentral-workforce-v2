import type { NextConfig } from 'next';

// Production-specific webpack optimizations
// This file is used only for production builds to avoid Turbopack conflicts
export const productionWebpackConfig = (config: any, { isServer }: { isServer: boolean }) => {
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