import {
  FilterConfig,
  QuickFilterConfig,
  STANDARD_DATE_PRESETS,
  STANDARD_STATUS_OPTIONS,
  STANDARD_ROLE_OPTIONS,
  STANDARD_AMOUNT_PRESETS,
} from '@/components/features/data';
import {
  IconClock,
  IconCalendar,
  IconUser,
  IconTrendingUp,
  IconAlertCircle,
  IconCheck,
  IconCurrencyDollar,
  IconUserPlus,
} from '@tabler/icons-react';

// HUNKCentral-specific filter configurations
export const HUNKCENTRAL_FILTERS = {
  // Common filters used across multiple views
  dateRange: {
    key: 'dateRange',
    label: 'Date Range',
    type: 'dateRange',
    presets: STANDARD_DATE_PRESETS,
  } as FilterConfig,

  status: {
    key: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: STANDARD_STATUS_OPTIONS,
  } as FilterConfig,

  role: {
    key: 'role',
    label: 'Role',
    type: 'multiSelect',
    options: STANDARD_ROLE_OPTIONS,
  } as FilterConfig,

  amountRange: {
    key: 'amountRange',
    label: 'Amount Range',
    type: 'numberRange',
    presets: STANDARD_AMOUNT_PRESETS,
  } as FilterConfig,

  // Log-specific filters
  captain: {
    key: 'captain',
    label: 'Captain',
    type: 'select',
    options: [], // Will be populated dynamically
  } as FilterConfig,

  jobType: {
    key: 'jobType',
    label: 'Job Type',
    type: 'multiSelect',
    options: [
      { value: 'junk', label: 'Junk Removal' },
      { value: 'move', label: 'Moving' },
      { value: 'other', label: 'Other Services' },
    ],
  } as FilterConfig,

  laborCostPercent: {
    key: 'laborCostPercent',
    label: 'Labor Cost %',
    type: 'numberRange',
    presets: [
      { label: 'Under 10%', value: { max: 10 } },
      { label: '10% - 15%', value: { min: 10, max: 15 } },
      { label: '15% - 20%', value: { min: 15, max: 20 } },
      { label: '20% - 25%', value: { min: 20, max: 25 } },
      { label: 'Over 25%', value: { min: 25 } },
    ],
  } as FilterConfig,

  // Commission-specific filters
  salesConsultant: {
    key: 'salesConsultant',
    label: 'Sales Consultant',
    type: 'select',
    options: [], // Will be populated dynamically
  } as FilterConfig,

  commissionStatus: {
    key: 'commissionStatus',
    label: 'Commission Status',
    type: 'multiSelect',
    options: [
      { value: 'pending', label: 'Pending Match', color: 'yellow' },
      { value: 'matched', label: 'Matched', color: 'blue' },
      { value: 'approved', label: 'Approved', color: 'green' },
      { value: 'conflict', label: 'Conflict', color: 'red' },
    ],
  } as FilterConfig,

  // Payroll-specific filters
  department: {
    key: 'department',
    label: 'Department',
    type: 'multiSelect',
    options: [
      { value: 'junk', label: 'Junk Removal' },
      { value: 'move', label: 'Moving' },
      { value: 'sales', label: 'Sales' },
      { value: 'admin', label: 'Administration' },
    ],
  } as FilterConfig,

  location: {
    key: 'location',
    label: 'Location',
    type: 'select',
    options: [], // Will be populated dynamically
  } as FilterConfig,

  compensationType: {
    key: 'compensationType',
    label: 'Compensation Type',
    type: 'multiSelect',
    options: [
      { value: 'hourly', label: 'Hourly' },
      { value: 'salary', label: 'Salary' },
      { value: 'commission', label: 'Commission' },
      { value: 'bonus', label: 'Bonus' },
    ],
  } as FilterConfig,

  hoursRange: {
    key: 'hoursRange',
    label: 'Hours Worked',
    type: 'numberRange',
    presets: [
      { label: 'Under 20 hours', value: { max: 20 } },
      { label: '20-40 hours', value: { min: 20, max: 40 } },
      { label: '40-60 hours', value: { min: 40, max: 60 } },
      { label: 'Over 60 hours', value: { min: 60 } },
    ],
  } as FilterConfig,
};

// Quick filter configurations for different views
export const QUICK_FILTERS = {
  logs: [
    {
      key: 'pending',
      label: 'Pending Approval',
      value: { status: 'pending' },
      icon: IconClock,
    },
    {
      key: 'today',
      label: 'Today',
      value: { dateRange: { preset: 'today' } },
      icon: IconCalendar,
    },
    {
      key: 'myLogs',
      label: 'My Logs',
      value: { captain: 'current_user' },
      icon: IconUser,
    },
    {
      key: 'highRevenue',
      label: 'High Revenue',
      value: { amountRange: { min: 5000 } },
      icon: IconTrendingUp,
    },
  ] as QuickFilterConfig[],

  payroll: [
    {
      key: 'currentPeriod',
      label: 'Current Period',
      value: { dateRange: { preset: 'currentPayPeriod' } },
      icon: IconCalendar,
    },
    {
      key: 'needsReview',
      label: 'Needs Review',
      value: { status: 'pending' },
      icon: IconAlertCircle,
    },
    {
      key: 'highEarners',
      label: 'Top Earners',
      value: { amountRange: { min: 3000 } },
      icon: IconTrendingUp,
    },
    {
      key: 'newEmployees',
      label: 'New Employees',
      value: { hireDate: { preset: 'last30days' } },
      icon: IconUserPlus,
    },
  ] as QuickFilterConfig[],

  commission: [
    {
      key: 'pending',
      label: 'Pending Match',
      value: { commissionStatus: 'pending' },
      icon: IconClock,
    },
    {
      key: 'matched',
      label: 'Matched',
      value: { commissionStatus: 'matched' },
      icon: IconCheck,
    },
    {
      key: 'thisWeek',
      label: 'This Week',
      value: { dateRange: { preset: 'last7days' } },
      icon: IconCalendar,
    },
    {
      key: 'highValue',
      label: 'High Value',
      value: { amountRange: { min: 2000 } },
      icon: IconCurrencyDollar,
    },
  ] as QuickFilterConfig[],

  users: [
    {
      key: 'active',
      label: 'Active Users',
      value: { status: 'active' },
      icon: IconCheck,
    },
    {
      key: 'captains',
      label: 'Captains',
      value: { role: 'captain' },
      icon: IconUser,
    },
    {
      key: 'managers',
      label: 'Managers',
      value: { role: 'manager' },
      icon: IconUser,
    },
    {
      key: 'recentHires',
      label: 'Recent Hires',
      value: { hireDate: { preset: 'last30days' } },
      icon: IconUserPlus,
    },
  ] as QuickFilterConfig[],
};

// Filter sets for specific views
export const FILTER_SETS = {
  logs: [
    HUNKCENTRAL_FILTERS.dateRange,
    HUNKCENTRAL_FILTERS.status,
    HUNKCENTRAL_FILTERS.captain,
    HUNKCENTRAL_FILTERS.jobType,
    HUNKCENTRAL_FILTERS.amountRange,
    HUNKCENTRAL_FILTERS.laborCostPercent,
  ],

  payroll: [
    HUNKCENTRAL_FILTERS.dateRange,
    HUNKCENTRAL_FILTERS.role,
    HUNKCENTRAL_FILTERS.department,
    HUNKCENTRAL_FILTERS.location,
    HUNKCENTRAL_FILTERS.compensationType,
    HUNKCENTRAL_FILTERS.amountRange,
    HUNKCENTRAL_FILTERS.hoursRange,
  ],

  commission: [
    HUNKCENTRAL_FILTERS.dateRange,
    HUNKCENTRAL_FILTERS.commissionStatus,
    HUNKCENTRAL_FILTERS.salesConsultant,
    HUNKCENTRAL_FILTERS.amountRange,
  ],

  users: [
    HUNKCENTRAL_FILTERS.status,
    HUNKCENTRAL_FILTERS.role,
    HUNKCENTRAL_FILTERS.department,
    HUNKCENTRAL_FILTERS.location,
    {
      key: 'hireDate',
      label: 'Hire Date',
      type: 'dateRange',
      presets: STANDARD_DATE_PRESETS,
    } as FilterConfig,
  ],

  reports: [
    HUNKCENTRAL_FILTERS.dateRange,
    HUNKCENTRAL_FILTERS.department,
    HUNKCENTRAL_FILTERS.location,
    HUNKCENTRAL_FILTERS.role,
  ],
};

// Utility functions for dynamic filter population
export function populateUserOptions(users: any[]): FilterConfig[] {
  const captainOptions = users
    .filter((user) => user.role === 'captain')
    .map((user) => ({ value: user.id, label: user.fullName }));

  const salesOptions = users
    .filter((user) => user.role === 'sales')
    .map((user) => ({ value: user.id, label: user.fullName }));

  return [
    {
      ...HUNKCENTRAL_FILTERS.captain,
      options: captainOptions,
    },
    {
      ...HUNKCENTRAL_FILTERS.salesConsultant,
      options: salesOptions,
    },
  ];
}

export function populateLocationOptions(locations: any[]): FilterConfig {
  return {
    ...HUNKCENTRAL_FILTERS.location,
    options: locations.map((location) => ({
      value: location.id,
      label: location.name,
    })),
  };
}

// Export utility for creating filter configurations
export function createFilterConfig(
  key: string,
  label: string,
  type: FilterConfig['type'],
  options?: any
): FilterConfig {
  const baseConfig = {
    key,
    label,
    type,
  };

  switch (type) {
    case 'dateRange':
      return {
        ...baseConfig,
        type: 'dateRange',
        presets: options?.presets || STANDARD_DATE_PRESETS,
      } as FilterConfig;

    case 'numberRange':
      return {
        ...baseConfig,
        type: 'numberRange',
        presets: options?.presets,
        min: options?.min,
        max: options?.max,
        step: options?.step,
      } as FilterConfig;

    case 'select':
    case 'multiSelect':
      return {
        ...baseConfig,
        type,
        options: options?.options || [],
      } as FilterConfig;

    case 'text':
      return {
        ...baseConfig,
        type: 'text',
        placeholder: options?.placeholder,
        multiline: options?.multiline,
      } as FilterConfig;

    case 'boolean':
      return {
        ...baseConfig,
        type: 'boolean',
        trueLabel: options?.trueLabel,
        falseLabel: options?.falseLabel,
      } as FilterConfig;

    default:
      return baseConfig as FilterConfig;
  }
}
