/**
 * Safely format a date value with proper type checking
 */
export function safeFormatDate(
  date: unknown,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'N/A';

  let dateObj: Date;

  // Handle different input types
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    return 'Invalid Date';
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  try {
    return dateObj.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateObj.toISOString().split('T')[0]; // Fallback to ISO date
  }
}

/**
 * Safely format a date and time value
 */
export function safeFormatDateTime(
  date: unknown,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'N/A';

  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    return 'Invalid Date';
  }

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  try {
    return dateObj.toLocaleString(undefined, options);
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return dateObj.toISOString().replace('T', ' ').split('.')[0]; // Fallback
  }
}

/**
 * Safely format a time value
 */
export function safeFormatTime(
  date: unknown,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'N/A';

  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    return 'Invalid Time';
  }

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }

  try {
    return dateObj.toLocaleTimeString(undefined, options);
  } catch (error) {
    console.warn('Time formatting error:', error);
    return dateObj.toISOString().split('T')[1].split('.')[0]; // Fallback to HH:MM:SS
  }
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Convert various date formats to a Date object safely
 */
export function toSafeDate(date: unknown): Date | null {
  if (!date) return null;

  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  return null;
}

/**
 * Format a date for display in forms (YYYY-MM-DD)
 */
export function formatDateForInput(date: unknown): string {
  const safeDate = toSafeDate(date);
  if (!safeDate) return '';

  try {
    return safeDate.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Date input formatting error:', error);
    return '';
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: unknown): string {
  const safeDate = toSafeDate(date);
  if (!safeDate) return 'Unknown time';

  const now = new Date();
  const diffMs = now.getTime() - safeDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return safeFormatDate(safeDate);
}
