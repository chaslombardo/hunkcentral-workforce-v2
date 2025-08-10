/**
 * Utility functions for formatting data in reports and UI components
 */

/**
 * Format a number as currency (USD)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format hours with one decimal place
 */
export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}h`;
};

/**
 * Format a date in short format (e.g., "Jan 15, 2025")
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a percentage with one decimal place
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Calculate labor cost percentage with proper rounding
 */
export const calculateLaborPercentage = (laborCost: number, revenue: number): number => {
  if (revenue === 0) return 0;
  return Math.round((laborCost / revenue) * 100 * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate trend percentage between current and previous values
 */
export const calculateTrend = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
  if (previous === 0) return { percentage: 0, isPositive: false };
  const change = ((current - previous) / previous) * 100;
  return {
    percentage: change,
    isPositive: change > 0,
  };
};