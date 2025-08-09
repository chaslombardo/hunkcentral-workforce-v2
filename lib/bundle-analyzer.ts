/**
 * Bundle size analysis and optimization utilities
 * Helps identify and optimize bundle size issues in development
 */

import * as React from 'react';

// Bundle size tracking
interface BundleStats {
  componentName: string;
  estimatedSize: number;
  renderCount: number;
  lastUsed: Date;
  variants: string[];
  unusedVariants: string[];
}

class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private componentStats = new Map<string, BundleStats>();
  private isEnabled = process.env.NODE_ENV === 'development';

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  /**
   * Track component usage for bundle optimization
   */
  trackComponentUsage(
    componentName: string, 
    variant?: string, 
    props?: Record<string, unknown>
  ): void {
    if (!this.isEnabled) return;

    const existing = this.componentStats.get(componentName);
    const estimatedSize = this.estimateSize(props);

    if (existing) {
      existing.renderCount++;
      existing.lastUsed = new Date();
      if (variant && !existing.variants.includes(variant)) {
        existing.variants.push(variant);
      }
    } else {
      this.componentStats.set(componentName, {
        componentName,
        estimatedSize,
        renderCount: 1,
        lastUsed: new Date(),
        variants: variant ? [variant] : [],
        unusedVariants: []
      });
    }
  }

  /**
   * Mark variants as unused for tree-shaking optimization
   */
  markUnusedVariants(componentName: string, unusedVariants: string[]): void {
    if (!this.isEnabled) return;

    const stats = this.componentStats.get(componentName);
    if (stats) {
      stats.unusedVariants = unusedVariants;
    }
  }

  /**
   * Estimate component size based on props
   */
  private estimateSize(props?: Record<string, unknown>): number {
    if (!props) return 0;
    
    try {
      return JSON.stringify(props).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get bundle optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    component: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const recommendations: Array<{
      component: string;
      issue: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    for (const [componentName, stats] of this.componentStats) {
      // Large component props
      if (stats.estimatedSize > 1000) {
        recommendations.push({
          component: componentName,
          issue: `Large props (${(stats.estimatedSize / 1024).toFixed(2)}KB)`,
          recommendation: 'Consider memoizing props or breaking into smaller components',
          priority: 'high'
        });
      }

      // Unused variants
      if (stats.unusedVariants.length > 0) {
        recommendations.push({
          component: componentName,
          issue: `Unused variants: ${stats.unusedVariants.join(', ')}`,
          recommendation: 'Remove unused variants to improve tree-shaking',
          priority: 'medium'
        });
      }

      // Rarely used components
      const daysSinceLastUsed = (Date.now() - stats.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUsed > 7 && stats.renderCount < 5) {
        recommendations.push({
          component: componentName,
          issue: 'Rarely used component',
          recommendation: 'Consider lazy loading or removing if not needed',
          priority: 'low'
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Log bundle analysis results
   */
  logAnalysis(): void {
    if (!this.isEnabled) return;

    const recommendations = this.getOptimizationRecommendations();
    
    if (recommendations.length === 0) {
      console.warn('📦 Bundle Analysis: No optimization opportunities found');
      return;
    }

    console.warn('📦 Bundle Optimization Recommendations');
    
    recommendations.forEach(({ component, issue, recommendation, priority }) => {
      const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
      console.warn(`${emoji} ${component}: ${issue}`);
      console.warn(`   💡 ${recommendation}`);
    });
  }

  /**
   * Get component statistics
   */
  getComponentStats(): Map<string, BundleStats> {
    return new Map(this.componentStats);
  }

  /**
   * Clear all statistics
   */
  clear(): void {
    this.componentStats.clear();
  }
}

// Export singleton instance
export const bundleAnalyzer = BundleAnalyzer.getInstance();

/**
 * Hook for tracking component bundle impact
 */
export function useBundleTracking(
  componentName: string, 
  variant?: string, 
  props?: Record<string, unknown>
) {
  React.useEffect(() => {
    bundleAnalyzer.trackComponentUsage(componentName, variant, props);
  }, [componentName, variant, props]);
}

/**
 * Tree-shaking optimization helpers
 */
export const treeShaking = {
  /**
   * Mark component variants for potential removal
   */
  markUnusedVariants: (componentName: string, allVariants: string[], usedVariants: string[]) => {
    const unusedVariants = allVariants.filter(variant => !usedVariants.includes(variant));
    bundleAnalyzer.markUnusedVariants(componentName, unusedVariants);
    
    if (process.env.NODE_ENV === 'development' && unusedVariants.length > 0) {
      console.warn(
        `🌳 ${componentName}: ${unusedVariants.length} unused variants detected: ${unusedVariants.join(', ')}`
      );
    }
  },

  /**
   * Analyze component variant usage
   */
  analyzeVariantUsage: (componentName: string, variants: Record<string, boolean>) => {
    const usedVariants = Object.entries(variants)
      .filter(([, isUsed]) => isUsed)
      .map(([variant]) => variant);
    
    const allVariants = Object.keys(variants);
    const usagePercentage = (usedVariants.length / allVariants.length) * 100;
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `📊 ${componentName} variant usage: ${usagePercentage.toFixed(1)}% (${usedVariants.length}/${allVariants.length})`
      );
    }
    
    treeShaking.markUnusedVariants(componentName, allVariants, usedVariants);
  }
};

/**
 * Code splitting helpers
 */
export const codeSplitting = {
  /**
   * Preload component chunks based on user interaction
   */
  preloadOnHover: (importFn: () => Promise<unknown>) => {
    return {
      onMouseEnter: () => {
        // Preload on hover with a small delay to avoid unnecessary loads
        setTimeout(() => {
          importFn().catch(() => {
            // Ignore preload failures
          });
        }, 100);
      }
    };
  },

  /**
   * Preload component chunks on route change
   */
  preloadOnRoute: (route: string, importFn: () => Promise<unknown>) => {
    if (typeof window !== 'undefined' && window.location.pathname.includes(route)) {
      importFn().catch(() => {
        // Ignore preload failures
      });
    }
  }
};

// Development-only bundle analysis logging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Log bundle analysis every 60 seconds in development
  setInterval(() => {
    bundleAnalyzer.logAnalysis();
  }, 60000);

  // Add to window for manual inspection
  (window as unknown as Record<string, unknown>).__bundleAnalyzer = bundleAnalyzer;
}

export default bundleAnalyzer;