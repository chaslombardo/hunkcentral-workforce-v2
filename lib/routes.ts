// Route definitions and navigation helpers
import type { UserRole } from '@/types';

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/login',

  // Protected routes
  DASHBOARD: '/dashboard',

  // Log routes
  LOGS: '/logs',
  CREATE_LOG: '/logs/create',
  CREATE_LOG_V1: '/logs/create-v1',
  CREATE_LOG_V2: '/logs/create-v2',
  CREATE_LOG_V3: '/logs/create-v3',
  REVIEW_LOGS: '/logs/review',
  LOG_DETAIL: (id: string) => `/logs/${id}`,

  // Commission routes
  COMMISSION: '/commission',
  CREATE_COMMISSION: '/commission/create',
  COMMISSION_LIST: '/commission/list',

  // Report routes
  REPORTS: '/reports',
  PAYROLL_REPORTS: '/reports/payroll',
  REPORTS_ANALYTICS: '/reports/analytics',
  MY_PAYROLL: '/reports/my-payroll',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_MONITORING: '/admin/monitoring',
  MANAGE_USERS: '/admin/users',
  PAY_PERIODS: '/admin/pay-periods',
  ADMIN_AUDIT: '/admin/audit',
  MONITORING_RULES: '/admin/monitoring/rules',
  ANALYTICS_SETTINGS: '/admin/analytics/settings',
  PERFORMANCE_STUDIO: '/admin/performance/studio',
} as const;

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  roles?: UserRole[];
  children?: NavItem[];
}

export const NAVIGATION: NavItem[] = [
  {
    title: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: 'LayoutDashboard',
    roles: ['admin', 'manager', 'captain', 'sales', 'wingman'],
  },
  {
    title: 'Daily Logs',
    href: ROUTES.LOGS,
    icon: 'FileText',
    roles: ['admin', 'manager', 'captain'],
    children: [
      {
        title: 'Create Log (Classic)',
        href: ROUTES.CREATE_LOG,
        roles: ['captain'],
      },
      {
        title: 'Create Log (Single Page)',
        href: ROUTES.CREATE_LOG_V1,
        roles: ['captain'],
      },
      {
        title: 'Create Log (Grid View)',
        href: ROUTES.CREATE_LOG_V2,
        roles: ['captain'],
      },
      {
        title: 'Create Log (Wizard)',
        href: ROUTES.CREATE_LOG_V3,
        roles: ['captain'],
      },
      {
        title: 'Review Logs',
        href: ROUTES.REVIEW_LOGS,
        roles: ['admin', 'manager'],
      },
    ],
  },
  {
    title: 'Commission',
    href: ROUTES.COMMISSION,
    icon: 'DollarSign',
    roles: ['admin', 'manager', 'sales'],
    children: [
      {
        title: 'Create Entry',
        href: ROUTES.CREATE_COMMISSION,
        roles: ['sales'],
      },
      {
        title: 'Track Commission',
        href: ROUTES.COMMISSION_LIST,
        roles: ['admin', 'manager', 'sales'],
      },
    ],
  },
  {
    title: 'Reports',
    href: ROUTES.REPORTS,
    icon: 'BarChart3',
    roles: ['admin', 'manager', 'captain', 'sales', 'wingman'],
    children: [
      {
        title: 'Payroll Reports',
        href: ROUTES.PAYROLL_REPORTS,
        roles: ['admin', 'manager'],
      },
      {
        title: 'My Payroll',
        href: ROUTES.MY_PAYROLL,
        roles: ['captain', 'sales', 'wingman'],
      },
    ],
  },
  {
    title: 'Administration',
    href: ROUTES.ADMIN,
    icon: 'Settings',
    roles: ['admin'],
    children: [
      {
        title: 'Monitoring Overview',
        href: ROUTES.ADMIN_MONITORING,
        roles: ['admin'],
      },
      {
        title: 'Manage Users',
        href: ROUTES.MANAGE_USERS,
        roles: ['admin'],
      },
      {
        title: 'Pay Periods',
        href: ROUTES.PAY_PERIODS,
        roles: ['admin'],
      },
      {
        title: 'Monitoring Rules',
        href: ROUTES.MONITORING_RULES,
        roles: ['admin'],
      },
      {
        title: 'Analytics Settings',
        href: ROUTES.ANALYTICS_SETTINGS,
        roles: ['admin'],
      },
      {
        title: 'Performance Studio',
        href: ROUTES.PERFORMANCE_STUDIO,
        roles: ['admin'],
      },
      {
        title: 'Security & Audit',
        href: ROUTES.ADMIN_AUDIT,
        roles: ['admin'],
      },
    ],
  },
];

/**
 * Filter navigation items based on user roles
 */
export function getNavigationForRoles(userRoles: UserRole[]): NavItem[] {
  return NAVIGATION.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((role) => userRoles.includes(role));
  }).map((item) => ({
    ...item,
    children: item.children?.filter((child) => {
      if (!child.roles) return true;
      return child.roles.some((role) => userRoles.includes(role));
    }),
  }));
}

/**
 * Check if a user has access to a specific route
 */
export function hasRouteAccess(route: string, userRoles: UserRole[]): boolean {
  // Public routes are always accessible
  if (route === ROUTES.HOME || route === ROUTES.LOGIN) {
    return true;
  }

  // Find the navigation item for this route
  const findNavItem = (
    items: NavItem[],
    targetRoute: string
  ): NavItem | null => {
    for (const item of items) {
      if (item.href === targetRoute) return item;
      if (item.children) {
        const found = findNavItem(item.children, targetRoute);
        if (found) return found;
      }
    }
    return null;
  };

  const navItem = findNavItem(NAVIGATION, route);
  if (!navItem || !navItem.roles) return false;

  return navItem.roles.some((role) => userRoles.includes(role));
}
