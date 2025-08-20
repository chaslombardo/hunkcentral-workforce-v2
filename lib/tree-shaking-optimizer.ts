/**
 * Tree-shaking optimization utilities
 * Analyzes component usage patterns and identifies unused variants for removal
 */

import { bundleAnalyzer, treeShaking } from './bundle-analyzer';

// Component variant analysis
interface ComponentVariantAnalysis {
  componentName: string;
  totalVariants: number;
  usedVariants: string[];
  unusedVariants: string[];
  usagePercentage: number;
  recommendations: string[];
}

/**
 * Analyze component variant usage across the application
 */
export function analyzeComponentVariants(): ComponentVariantAnalysis[] {
  const stats = bundleAnalyzer.getComponentStats();
  const analyses: ComponentVariantAnalysis[] = [];

  // Define known component variants for analysis
  const componentVariants: Record<string, string[]> = {
    BrandButton: [
      'primary',
      'secondary',
      'success',
      'warning',
      'outline-primary',
      'outline-secondary',
      'ghost-primary',
      'ghost-secondary',
      'destructive',
      'outline',
      'ghost',
      'link',
    ],
    StatusIndicator: [
      'pending',
      'approved',
      'matched',
      'rejected',
      'open',
      'locked',
      'closed',
      'active',
      'inactive',
      'success',
      'warning',
      'error',
      'info',
      'processing',
      'draft',
      'submitted',
      'completed',
    ],
    BrandLoading: ['spinner', 'dots', 'pulse'],
    MetricCard: ['green', 'orange', 'blue', 'purple', 'neutral'],
    SmartInput: ['default', 'email', 'numeric', 'tel', 'url', 'search'],
    FormFeedback: ['success', 'error', 'warning', 'info'],
  };

  for (const [componentName, allVariants] of Object.entries(
    componentVariants
  )) {
    const componentStats = stats.get(componentName);
    const usedVariants = componentStats?.variants || [];
    const unusedVariants = allVariants.filter(
      (variant) => !usedVariants.includes(variant)
    );
    const usagePercentage = (usedVariants.length / allVariants.length) * 100;

    const recommendations: string[] = [];

    // Generate recommendations based on usage patterns
    if (unusedVariants.length > allVariants.length * 0.5) {
      recommendations.push(
        'Consider creating a minimal version with only used variants'
      );
    }

    if (usedVariants.length === 1) {
      recommendations.push(
        'Only one variant is used - consider simplifying the component'
      );
    }

    if (unusedVariants.length > 0) {
      recommendations.push(
        `Remove unused variants: ${unusedVariants.slice(0, 3).join(', ')}${unusedVariants.length > 3 ? '...' : ''}`
      );
    }

    analyses.push({
      componentName,
      totalVariants: allVariants.length,
      usedVariants,
      unusedVariants,
      usagePercentage,
      recommendations,
    });

    // Mark unused variants for tree-shaking
    treeShaking.markUnusedVariants(componentName, allVariants, usedVariants);
  }

  return analyses.sort((a, b) => a.usagePercentage - b.usagePercentage);
}

/**
 * Generate bundle optimization report
 */
export function generateOptimizationReport(): {
  summary: {
    totalComponents: number;
    componentsWithUnusedVariants: number;
    totalUnusedVariants: number;
    averageUsagePercentage: number;
  };
  componentAnalyses: ComponentVariantAnalysis[];
  recommendations: string[];
} {
  const analyses = analyzeComponentVariants();

  const summary = {
    totalComponents: analyses.length,
    componentsWithUnusedVariants: analyses.filter(
      (a) => a.unusedVariants.length > 0
    ).length,
    totalUnusedVariants: analyses.reduce(
      (sum, a) => sum + a.unusedVariants.length,
      0
    ),
    averageUsagePercentage:
      analyses.reduce((sum, a) => sum + a.usagePercentage, 0) / analyses.length,
  };

  const recommendations: string[] = [];

  // Global recommendations
  if (summary.averageUsagePercentage < 50) {
    recommendations.push(
      'Consider creating minimal component variants to reduce bundle size'
    );
  }

  if (summary.totalUnusedVariants > 10) {
    recommendations.push(
      'High number of unused variants detected - implement tree-shaking optimizations'
    );
  }

  // Component-specific recommendations
  const lowUsageComponents = analyses.filter((a) => a.usagePercentage < 30);
  if (lowUsageComponents.length > 0) {
    recommendations.push(
      `Components with low variant usage: ${lowUsageComponents.map((c) => c.componentName).join(', ')}`
    );
  }

  return {
    summary,
    componentAnalyses: analyses,
    recommendations,
  };
}

/**
 * Create optimized component variants based on usage analysis
 */
export function createOptimizedVariants(componentName: string): {
  minimalVariants: string[];
  codeTemplate: string;
} {
  const analysis = analyzeComponentVariants().find(
    (a) => a.componentName === componentName
  );

  if (!analysis) {
    return {
      minimalVariants: [],
      codeTemplate: '// No analysis data available',
    };
  }

  const minimalVariants = analysis.usedVariants;

  // Generate code template for optimized component
  const codeTemplate = `
// Optimized ${componentName} with only used variants
// Generated based on usage analysis - ${analysis.usagePercentage.toFixed(1)}% variant usage

const optimized${componentName}Variants = {
${minimalVariants.map((variant) => `  ${variant}: "/* variant styles */",`).join('\n')}
};

// Removed unused variants: ${analysis.unusedVariants.join(', ')}
// Bundle size reduction: ~${((analysis.unusedVariants.length / analysis.totalVariants) * 100).toFixed(1)}%
`;

  return {
    minimalVariants,
    codeTemplate,
  };
}

/**
 * Log optimization report to console (development only)
 */
export function logOptimizationReport(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const report = generateOptimizationReport();

  console.warn('🌳 Tree-Shaking Optimization Report');

  console.warn('📊 Summary:', report.summary);

  if (report.componentAnalyses.length > 0) {
    console.warn(
      '📋 Component Analysis:',
      report.componentAnalyses.map((analysis) => ({
        Component: analysis.componentName,
        'Total Variants': analysis.totalVariants,
        'Used Variants': analysis.usedVariants.length,
        'Unused Variants': analysis.unusedVariants.length,
        'Usage %': `${analysis.usagePercentage.toFixed(1)}%`,
      }))
    );
  }

  if (report.recommendations.length > 0) {
    console.warn('💡 Recommendations:', report.recommendations);
  }
}

/**
 * Webpack plugin helper for automatic tree-shaking
 */
export function createTreeShakingPlugin() {
  return {
    name: 'tree-shaking-optimizer',
    buildStart() {
      if (process.env.NODE_ENV === 'development') {
        logOptimizationReport();
      }
    },
  };
}

// Auto-run optimization analysis in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run analysis every 2 minutes in development
  setInterval(() => {
    logOptimizationReport();
  }, 120000);

  // Add to window for manual inspection
  (window as unknown as Record<string, unknown>).__treeShakingOptimizer = {
    analyzeComponentVariants,
    generateOptimizationReport,
    createOptimizedVariants,
    logOptimizationReport,
  };
}

const treeShakingOptimizer = {
  analyzeComponentVariants,
  generateOptimizationReport,
  createOptimizedVariants,
  logOptimizationReport,
  createTreeShakingPlugin,
};

export default treeShakingOptimizer;
