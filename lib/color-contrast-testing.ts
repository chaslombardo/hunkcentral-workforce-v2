/**
 * Color Contrast Testing Utilities
 * 
 * Comprehensive utilities for testing and ensuring WCAG color contrast compliance
 * across all brand color combinations and UI states.
 */

import * as React from "react";
import { getContrastRatio, meetsContrastRequirement, BRAND_COLORS } from './accessibility-utils';

// Extended color palette for testing
const EXTENDED_COLORS = {
  // Brand colors
  'hunks-green': BRAND_COLORS['hunks-green'].DEFAULT,
  'hunks-green-light': BRAND_COLORS['hunks-green'][400],
  'hunks-green-dark': BRAND_COLORS['hunks-green'][700],
  'hunks-orange': BRAND_COLORS['hunks-orange'].DEFAULT,
  'hunks-orange-light': BRAND_COLORS['hunks-orange'][400],
  'hunks-orange-dark': BRAND_COLORS['hunks-orange'][700],
  
  // System colors
  'white': '#ffffff',
  'black': '#000000',
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  
  // Status colors
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'yellow-500': '#eab308',
  'yellow-600': '#ca8a04',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
} as const;

interface ContrastTestResult {
  combination: string;
  foreground: string;
  background: string;
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  wcagAALarge: boolean;
  wcagAAALarge: boolean;
  recommendation: 'pass' | 'warning' | 'fail';
  suggestions?: string[];
}

/**
 * Test all brand color combinations for contrast compliance
 */
export function testBrandColorContrast(): ContrastTestResult[] {
  const results: ContrastTestResult[] = [];
  
  // Define critical color combinations to test
  const combinations = [
    // Primary brand combinations
    { name: 'Hunks Green on White', fg: 'hunks-green', bg: 'white' },
    { name: 'White on Hunks Green', fg: 'white', bg: 'hunks-green' },
    { name: 'Hunks Orange on White', fg: 'hunks-orange', bg: 'white' },
    { name: 'White on Hunks Orange', fg: 'white', bg: 'hunks-orange' },
    
    // Light variants
    { name: 'Hunks Green Light on White', fg: 'hunks-green-light', bg: 'white' },
    { name: 'Hunks Orange Light on White', fg: 'hunks-orange-light', bg: 'white' },
    
    // Dark variants
    { name: 'Hunks Green Dark on White', fg: 'hunks-green-dark', bg: 'white' },
    { name: 'Hunks Orange Dark on White', fg: 'hunks-orange-dark', bg: 'white' },
    
    // Dark mode combinations
    { name: 'Hunks Green Light on Dark', fg: 'hunks-green-light', bg: 'gray-900' },
    { name: 'Hunks Orange Light on Dark', fg: 'hunks-orange-light', bg: 'gray-900' },
    
    // Status combinations
    { name: 'Error Red on White', fg: 'red-600', bg: 'white' },
    { name: 'Warning Yellow on White', fg: 'yellow-600', bg: 'white' },
    { name: 'Success Green on White', fg: 'green-600', bg: 'white' },
    { name: 'Info Blue on White', fg: 'blue-600', bg: 'white' },
    
    // Gray combinations for text
    { name: 'Dark Gray on White', fg: 'gray-700', bg: 'white' },
    { name: 'Medium Gray on White', fg: 'gray-600', bg: 'white' },
    { name: 'Light Gray on White', fg: 'gray-500', bg: 'white' },
    
    // Reverse combinations
    { name: 'White on Dark Gray', fg: 'white', bg: 'gray-800' },
    { name: 'Light Gray on Dark', fg: 'gray-300', bg: 'gray-900' },
  ];
  
  combinations.forEach(({ name, fg, bg }) => {
    const foregroundColor = EXTENDED_COLORS[fg as keyof typeof EXTENDED_COLORS];
    const backgroundColor = EXTENDED_COLORS[bg as keyof typeof EXTENDED_COLORS];
    
    if (!foregroundColor || !backgroundColor) {
      console.warn(`Color not found: ${fg} or ${bg}`);
      return;
    }
    
    const ratio = getContrastRatio(foregroundColor, backgroundColor);
    const wcagAA = meetsContrastRequirement(foregroundColor, backgroundColor, 'AA', false);
    const wcagAAA = meetsContrastRequirement(foregroundColor, backgroundColor, 'AAA', false);
    const wcagAALarge = meetsContrastRequirement(foregroundColor, backgroundColor, 'AA', true);
    const wcagAAALarge = meetsContrastRequirement(foregroundColor, backgroundColor, 'AAA', true);
    
    let recommendation: 'pass' | 'warning' | 'fail' = 'fail';
    const suggestions: string[] = [];
    
    if (wcagAAA) {
      recommendation = 'pass';
    } else if (wcagAA) {
      recommendation = 'warning';
      suggestions.push('Meets WCAG AA but not AAA standards');
    } else if (wcagAALarge) {
      recommendation = 'warning';
      suggestions.push('Only suitable for large text (18pt+ or 14pt+ bold)');
    } else {
      recommendation = 'fail';
      suggestions.push('Does not meet WCAG contrast requirements');
      suggestions.push(`Current ratio: ${ratio.toFixed(2)}:1, minimum needed: 4.5:1`);
      
      // Suggest alternatives
      if (ratio < 3.0) {
        suggestions.push('Consider using a darker foreground or lighter background');
      } else if (ratio < 4.5) {
        suggestions.push('Consider adjusting colors slightly to meet AA standards');
      }
    }
    
    results.push({
      combination: name,
      foreground: foregroundColor,
      background: backgroundColor,
      ratio,
      wcagAA,
      wcagAAA,
      wcagAALarge,
      wcagAAALarge,
      recommendation,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    });
  });
  
  return results;
}

/**
 * Generate a contrast report for development
 */
export function generateContrastReport(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const results = testBrandColorContrast();
  
  console.warn('🎨 Color Contrast Report');
  
  const passed = results.filter(r => r.recommendation === 'pass');
  const warnings = results.filter(r => r.recommendation === 'warning');
  const failed = results.filter(r => r.recommendation === 'fail');
  
  console.warn(`✅ Passed: ${passed.length}`);
  console.warn(`⚠️  Warnings: ${warnings.length}`);
  console.warn(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.warn('❌ Failed Combinations');
    failed.forEach(result => {
      console.warn(`${result.combination}: ${result.ratio.toFixed(2)}:1`);
      result.suggestions?.forEach(suggestion => console.warn(`  - ${suggestion}`));
    });
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Warning Combinations');
    warnings.forEach(result => {
      console.warn(`${result.combination}: ${result.ratio.toFixed(2)}:1`);
      result.suggestions?.forEach(suggestion => console.warn(`  - ${suggestion}`));
    });
  }
}

/**
 * Test contrast of a specific element
 */
export function testElementContrast(element: HTMLElement): ContrastTestResult | null {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;
  
  // Skip if we can't determine colors
  if (!color || !backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)') {
    return null;
  }
  
  try {
    // Convert computed colors to hex (simplified - would need full color parsing in production)
    const foregroundHex = rgbToHex(color);
    const backgroundHex = rgbToHex(backgroundColor);
    
    if (!foregroundHex || !backgroundHex) {
      return null;
    }
    
    const ratio = getContrastRatio(foregroundHex, backgroundHex);
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = styles.fontWeight;
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
    
    const wcagAA = meetsContrastRequirement(foregroundHex, backgroundHex, 'AA', isLargeText);
    const wcagAAA = meetsContrastRequirement(foregroundHex, backgroundHex, 'AAA', isLargeText);
    const wcagAALarge = meetsContrastRequirement(foregroundHex, backgroundHex, 'AA', true);
    const wcagAAALarge = meetsContrastRequirement(foregroundHex, backgroundHex, 'AAA', true);
    
    let recommendation: 'pass' | 'warning' | 'fail' = 'fail';
    const suggestions: string[] = [];
    
    if (wcagAAA) {
      recommendation = 'pass';
    } else if (wcagAA) {
      recommendation = 'warning';
      suggestions.push('Meets WCAG AA but not AAA standards');
    } else {
      recommendation = 'fail';
      suggestions.push('Does not meet WCAG contrast requirements');
    }
    
    return {
      combination: `Element contrast test`,
      foreground: foregroundHex,
      background: backgroundHex,
      ratio,
      wcagAA,
      wcagAAA,
      wcagAALarge,
      wcagAAALarge,
      recommendation,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  } catch (error) {
    console.warn('Could not test element contrast:', error);
    return null;
  }
}

/**
 * Simple RGB to Hex conversion (simplified version)
 */
function rgbToHex(rgb: string): string | null {
  // Handle rgb() format
  const rgbMatch = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  // Handle rgba() format
  const rgbaMatch = rgb.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  // Handle hex format
  if (rgb.startsWith('#')) {
    return rgb;
  }
  
  return null;
}

/**
 * React hook for testing component contrast in development
 */
export function useContrastTesting(ref: React.RefObject<HTMLElement>, enabled = process.env.NODE_ENV === 'development') {
  React.useEffect(() => {
    if (!enabled || !ref.current) return;
    
    const result = testElementContrast(ref.current);
    if (result && result.recommendation === 'fail') {
      console.warn('Contrast issue detected:', result);
    }
  }, [enabled, ref]);
}