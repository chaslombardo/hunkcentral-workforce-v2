import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  FilterConfig,
  DateRangeValue,
  NumberRangeValue,
} from '@/components/features/data';

// URL state management for filters
export function useFilterState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const parseFiltersFromUrl = useCallback(
    (filterConfigs: FilterConfig[]) => {
      const filters: Record<string, any> = {};

      filterConfigs.forEach((config) => {
        const paramValue = searchParams.get(config.key);
        if (!paramValue) return;

        try {
          switch (config.type) {
            case 'select':
              filters[config.key] = paramValue;
              break;

            case 'multiSelect':
              filters[config.key] = paramValue.split(',');
              break;

            case 'dateRange':
              const dateRange = JSON.parse(paramValue) as DateRangeValue;
              if (dateRange.from) dateRange.from = new Date(dateRange.from);
              if (dateRange.to) dateRange.to = new Date(dateRange.to);
              filters[config.key] = dateRange;
              break;

            case 'numberRange':
              filters[config.key] = JSON.parse(paramValue) as NumberRangeValue;
              break;

            case 'text':
              filters[config.key] = paramValue;
              break;

            case 'boolean':
              filters[config.key] = paramValue === 'true';
              break;
          }
        } catch (error) {
          console.warn(`Failed to parse filter ${config.key}:`, error);
        }
      });

      return filters;
    },
    [searchParams]
  );

  // Update URL with filter values
  const updateUrlWithFilters = useCallback(
    (filters: Record<string, any>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' &&
            Object.values(value).every((v) => v === undefined || v === null))
        ) {
          params.delete(key);
        } else {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else if (typeof value === 'object') {
            params.set(key, JSON.stringify(value));
          } else {
            params.set(key, value.toString());
          }
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return {
    parseFiltersFromUrl,
    updateUrlWithFilters,
  };
}

// Local storage persistence for filter preferences
export function useFilterPreferences(key: string) {
  const savePreferences = useCallback(
    (filters: Record<string, any>) => {
      try {
        localStorage.setItem(`filter-prefs-${key}`, JSON.stringify(filters));
      } catch (error) {
        console.warn('Failed to save filter preferences:', error);
      }
    },
    [key]
  );

  const loadPreferences = useCallback((): Record<string, any> => {
    try {
      const saved = localStorage.getItem(`filter-prefs-${key}`);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load filter preferences:', error);
      return {};
    }
  }, [key]);

  const clearPreferences = useCallback(() => {
    try {
      localStorage.removeItem(`filter-prefs-${key}`);
    } catch (error) {
      console.warn('Failed to clear filter preferences:', error);
    }
  }, [key]);

  return {
    savePreferences,
    loadPreferences,
    clearPreferences,
  };
}

// Filter validation utilities
export function validateFilterValue(config: FilterConfig, value: any): boolean {
  if (value === undefined || value === null) return true;

  switch (config.type) {
    case 'select':
      return (
        (typeof value === 'string' &&
          config.options?.some((opt) => opt.value === value)) ||
        false
      );

    case 'multiSelect':
      return (
        Array.isArray(value) &&
        value.every((v) => config.options?.some((opt) => opt.value === v))
      );

    case 'dateRange':
      if (typeof value !== 'object') return false;
      const { from, to } = value as DateRangeValue;
      return (!from || from instanceof Date) && (!to || to instanceof Date);

    case 'numberRange':
      if (typeof value !== 'object') return false;
      const { min, max } = value as NumberRangeValue;
      return (
        (!min || typeof min === 'number') && (!max || typeof max === 'number')
      );

    case 'text':
      return typeof value === 'string';

    case 'boolean':
      return typeof value === 'boolean';

    default:
      return true;
  }
}

// Filter application utilities
export function applyFilters<T>(
  data: T[],
  filters: Record<string, any>,
  configs: FilterConfig[]
): T[] {
  return data.filter((item) => {
    return configs.every((config) => {
      const filterValue = filters[config.key];
      if (!filterValue) return true;

      const itemValue = (item as any)[config.key];

      switch (config.type) {
        case 'select':
          return itemValue === filterValue;

        case 'multiSelect':
          return Array.isArray(filterValue) && filterValue.includes(itemValue);

        case 'dateRange':
          if (!itemValue || !(itemValue instanceof Date)) return true;
          const { from, to } = filterValue as DateRangeValue;
          if (from && itemValue < from) return false;
          if (to && itemValue > to) return false;
          return true;

        case 'numberRange':
          if (typeof itemValue !== 'number') return true;
          const { min, max } = filterValue as NumberRangeValue;
          if (min !== undefined && itemValue < min) return false;
          if (max !== undefined && itemValue > max) return false;
          return true;

        case 'text':
          if (typeof itemValue !== 'string') return true;
          return itemValue.toLowerCase().includes(filterValue.toLowerCase());

        case 'boolean':
          return itemValue === filterValue;

        default:
          return true;
      }
    });
  });
}

// Filter summary utilities
export function getFilterSummary(
  filters: Record<string, any>,
  configs: FilterConfig[]
): string[] {
  const summaries: string[] = [];

  configs.forEach((config) => {
    const value = filters[config.key];
    if (!value) return;

    switch (config.type) {
      case 'select':
        const option = config.options?.find((opt) => opt.value === value);
        if (option) {
          summaries.push(`${config.label}: ${option.label}`);
        }
        break;

      case 'multiSelect':
        if (Array.isArray(value) && value.length > 0) {
          const labels = value.map((v) => {
            const opt = config.options?.find((opt) => opt.value === v);
            return opt?.label || v;
          });
          summaries.push(`${config.label}: ${labels.join(', ')}`);
        }
        break;

      case 'dateRange':
        const { from, to } = value as DateRangeValue;
        if (from || to) {
          let dateStr = config.label + ': ';
          if (from && to) {
            dateStr += `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
          } else if (from) {
            dateStr += `From ${from.toLocaleDateString()}`;
          } else if (to) {
            dateStr += `Until ${to.toLocaleDateString()}`;
          }
          summaries.push(dateStr);
        }
        break;

      case 'numberRange':
        const { min, max } = value as NumberRangeValue;
        if (min !== undefined || max !== undefined) {
          let rangeStr = config.label + ': ';
          if (min !== undefined && max !== undefined) {
            rangeStr += `${min.toLocaleString()} - ${max.toLocaleString()}`;
          } else if (min !== undefined) {
            rangeStr += `≥ ${min.toLocaleString()}`;
          } else if (max !== undefined) {
            rangeStr += `≤ ${max.toLocaleString()}`;
          }
          summaries.push(rangeStr);
        }
        break;

      case 'text':
        if (typeof value === 'string' && value.trim()) {
          summaries.push(`${config.label}: "${value}"`);
        }
        break;

      case 'boolean':
        if (typeof value === 'boolean') {
          const boolConfig = config as any;
          const label = value
            ? boolConfig.trueLabel || 'Yes'
            : boolConfig.falseLabel || 'No';
          summaries.push(`${config.label}: ${label}`);
        }
        break;
    }
  });

  return summaries;
}

// Export filter data utilities
export function exportFilteredData<T>(
  data: T[],
  filters: Record<string, any>,
  configs: FilterConfig[],
  format: 'csv' | 'json' = 'csv'
): string {
  const filteredData = applyFilters(data, filters, configs);

  if (format === 'json') {
    return JSON.stringify(filteredData, null, 2);
  }

  // CSV export
  if (filteredData.length === 0) return '';

  const headers = Object.keys(filteredData[0] as any);
  const csvRows = [
    headers.join(','),
    ...filteredData.map((row) =>
      headers
        .map((header) => {
          const value = (row as any)[header];
          // Escape commas and quotes in CSV
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}

// Advanced filter combinations
export function combineFilters(
  baseFilters: Record<string, any>,
  additionalFilters: Record<string, any>
): Record<string, any> {
  const combined = { ...baseFilters };

  Object.entries(additionalFilters).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      delete combined[key];
    } else if (Array.isArray(value) && Array.isArray(combined[key])) {
      // Merge arrays for multiSelect filters
      combined[key] = [...new Set([...combined[key], ...value])];
    } else {
      combined[key] = value;
    }
  });

  return combined;
}

// Filter preset management
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function saveFilterPreset(
  key: string,
  preset: Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt'>
): FilterPreset {
  const fullPreset: FilterPreset = {
    ...preset,
    id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const existingPresets = loadFilterPresets(key);
    const updatedPresets = [...existingPresets, fullPreset];
    localStorage.setItem(
      `filter-presets-${key}`,
      JSON.stringify(updatedPresets)
    );
    return fullPreset;
  } catch (error) {
    console.warn('Failed to save filter preset:', error);
    throw error;
  }
}

export function loadFilterPresets(key: string): FilterPreset[] {
  try {
    const saved = localStorage.getItem(`filter-presets-${key}`);
    if (!saved) return [];

    const presets = JSON.parse(saved) as FilterPreset[];
    // Convert date strings back to Date objects
    return presets.map((preset) => ({
      ...preset,
      createdAt: new Date(preset.createdAt),
      updatedAt: new Date(preset.updatedAt),
    }));
  } catch (error) {
    console.warn('Failed to load filter presets:', error);
    return [];
  }
}

export function deleteFilterPreset(key: string, presetId: string): void {
  try {
    const existingPresets = loadFilterPresets(key);
    const updatedPresets = existingPresets.filter((p) => p.id !== presetId);
    localStorage.setItem(
      `filter-presets-${key}`,
      JSON.stringify(updatedPresets)
    );
  } catch (error) {
    console.warn('Failed to delete filter preset:', error);
    throw error;
  }
}
