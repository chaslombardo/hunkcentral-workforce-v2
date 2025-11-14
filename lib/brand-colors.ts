/**
 * Brand Color Utility Functions
 *
 * This module provides utility functions for consistent usage of College Hunks brand colors
 * throughout the HUNKCentral application. It includes functions for getting color values,
 * generating color variants, and ensuring accessibility compliance.
 */

// Brand color definitions
export const BRAND_COLORS = {
  hunksGreen: {
    50: '#f0f9f4',
    100: '#dcf2e4',
    200: '#bce5cd',
    300: '#8dd1a8',
    400: '#57b67c',
    500: '#339b5a',
    600: '#026937', // Primary brand color
    700: '#1e5a32',
    800: '#1a4a2a',
    900: '#163d24',
    950: '#0b2214',
  },
  hunksOrange: {
    50: '#fef7ed',
    100: '#fdecd4',
    200: '#fbd5a8',
    300: '#f8b871',
    400: '#f59338',
    500: '#ea7200', // Secondary brand color
    600: '#dc5f02',
    700: '#b64906',
    800: '#92390c',
    900: '#78300d',
    950: '#411703',
  },
} as const;

// Semantic color mappings
export const SEMANTIC_COLORS = {
  primary: BRAND_COLORS.hunksGreen[600],
  primaryLight: BRAND_COLORS.hunksGreen[500],
  primaryDark: BRAND_COLORS.hunksGreen[700],
  secondary: BRAND_COLORS.hunksOrange[500],
  secondaryLight: BRAND_COLORS.hunksOrange[400],
  secondaryDark: BRAND_COLORS.hunksOrange[600],
  success: BRAND_COLORS.hunksGreen[600],
  warning: BRAND_COLORS.hunksOrange[500],
  error: '#dc2626', // Standard error red
  info: '#3b82f6', // Standard info blue
} as const;

// Color variant types
export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';
export type ColorShade =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950;

/**
 * Get a brand color by name and shade
 */
export function getBrandColor(
  color: 'hunksGreen' | 'hunksOrange',
  shade: ColorShade
): string {
  return BRAND_COLORS[color][shade];
}

/**
 * Get a semantic color by variant
 */
export function getSemanticColor(variant: ColorVariant): string {
  switch (variant) {
    case 'primary':
      return SEMANTIC_COLORS.primary;
    case 'secondary':
      return SEMANTIC_COLORS.secondary;
    case 'success':
      return SEMANTIC_COLORS.success;
    case 'warning':
      return SEMANTIC_COLORS.warning;
    case 'error':
      return SEMANTIC_COLORS.error;
    case 'info':
      return SEMANTIC_COLORS.info;
    default:
      return SEMANTIC_COLORS.primary;
  }
}

/**
 * Get CSS custom property name for brand colors
 */
export function getBrandCSSVar(
  variant: 'primary' | 'secondary',
  modifier?: 'light' | 'dark' | 'foreground'
): string {
  const base = `--brand-${variant}`;
  if (modifier) {
    return `${base}-${modifier}`;
  }
  return base;
}

/**
 * Get Tailwind class name for brand colors
 */
export function getBrandTailwindClass(
  property: 'bg' | 'text' | 'border' | 'ring',
  variant: 'primary' | 'secondary' | 'success' | 'warning',
  modifier?: 'light' | 'dark' | 'foreground'
): string {
  const colorName = modifier
    ? `brand-${variant}-${modifier}`
    : `brand-${variant}`;
  return `${property}-${colorName}`;
}

/**
 * Generate color variants for a given base color
 */
export function generateColorVariants(baseColor: string): {
  light: string;
  base: string;
  dark: string;
} {
  // This is a simplified implementation
  // In a real application, you might want to use a color manipulation library
  return {
    light: baseColor, // Would be lightened version
    base: baseColor,
    dark: baseColor, // Would be darkened version
  };
}

/**
 * Check if a color meets WCAG contrast requirements
 */
export function checkContrast(
  foreground: string,
  background: string
): {
  aa: boolean;
  aaa: boolean;
  ratio: number;
} {
  // This is a placeholder implementation
  // In a real application, you would implement proper contrast calculation
  console.warn('Checking contrast for:', foreground, 'on', background);
  // or use a library like 'color-contrast-checker'
  return {
    aa: true,
    aaa: true,
    ratio: 4.5,
  };
}

/**
 * Get appropriate text color for a given background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  // Simplified implementation - in reality, you'd calculate luminance
  const darkBackgrounds: string[] = [
    BRAND_COLORS.hunksGreen[600],
    BRAND_COLORS.hunksGreen[700],
    BRAND_COLORS.hunksGreen[800],
    BRAND_COLORS.hunksGreen[900],
    BRAND_COLORS.hunksGreen[950],
    BRAND_COLORS.hunksOrange[600],
    BRAND_COLORS.hunksOrange[700],
    BRAND_COLORS.hunksOrange[800],
    BRAND_COLORS.hunksOrange[900],
    BRAND_COLORS.hunksOrange[950],
  ];

  return darkBackgrounds.includes(backgroundColor) ? '#ffffff' : '#000000';
}

/**
 * Brand color presets for common UI elements
 */
export const BRAND_PRESETS = {
  button: {
    primary: {
      background: getBrandTailwindClass('bg', 'primary'),
      text: getBrandTailwindClass('text', 'primary', 'foreground'),
      hover: 'hover:bg-brand-primary-dark',
      focus: 'focus:ring-brand-primary',
    },
    secondary: {
      background: getBrandTailwindClass('bg', 'secondary'),
      text: getBrandTailwindClass('text', 'secondary', 'foreground'),
      hover: 'hover:bg-brand-secondary-dark',
      focus: 'focus:ring-brand-secondary',
    },
  },
  card: {
    primary: {
      border: getBrandTailwindClass('border', 'primary'),
      accent: 'border-l-4 border-l-brand-primary',
    },
    secondary: {
      border: getBrandTailwindClass('border', 'secondary'),
      accent: 'border-l-4 border-l-brand-secondary',
    },
  },
  status: {
    success: {
      background: 'bg-brand-success/10',
      text: getBrandTailwindClass('text', 'success'),
      border: getBrandTailwindClass('border', 'success'),
    },
    warning: {
      background: 'bg-brand-warning/10',
      text: getBrandTailwindClass('text', 'warning'),
      border: getBrandTailwindClass('border', 'warning'),
    },
  },
} as const;

/**
 * Export commonly used color combinations
 */
export const COLOR_COMBINATIONS = {
  primaryButton: `${BRAND_PRESETS.button.primary.background} ${BRAND_PRESETS.button.primary.text} ${BRAND_PRESETS.button.primary.hover} ${BRAND_PRESETS.button.primary.focus}`,
  secondaryButton: `${BRAND_PRESETS.button.secondary.background} ${BRAND_PRESETS.button.secondary.text} ${BRAND_PRESETS.button.secondary.hover} ${BRAND_PRESETS.button.secondary.focus}`,
  primaryCard: `${BRAND_PRESETS.card.primary.accent}`,
  secondaryCard: `${BRAND_PRESETS.card.secondary.accent}`,
  successStatus: `${BRAND_PRESETS.status.success.background} ${BRAND_PRESETS.status.success.text} ${BRAND_PRESETS.status.success.border}`,
  warningStatus: `${BRAND_PRESETS.status.warning.background} ${BRAND_PRESETS.status.warning.text} ${BRAND_PRESETS.status.warning.border}`,
} as const;
