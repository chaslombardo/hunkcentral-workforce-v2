'use client';

import * as React from 'react';
import {
  BarChart3,
  ClipboardList,
  DollarSign,
  Home,
  Settings,
  TrendingUp,
  Building2,
} from 'lucide-react';

import { NavMain } from '@/components/layout/nav-main';
import { NavUser } from '@/components/layout/nav-user';
import { TeamSwitcher } from '@/components/layout/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSession } from '@/hooks/useSession';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, hasRole, hasAnyRole } = useSession();

  if (!user) {
    return null;
  }

  // Daily Operations - Core workflow items
  const dailyOperations = [];

  // Dashboard is always available
  dailyOperations.push({
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    items: [],
  });

  // Daily Logs for captains and managers
  if (hasAnyRole(['captain', 'manager', 'admin'])) {
    dailyOperations.push({
      title: 'Daily Logs',
      url: '/logs',
      icon: ClipboardList,
      items: [
        ...(hasAnyRole(['captain', 'admin'])
          ? [
              {
                title: 'Create Log',
                url: '/logs/create',
              },
            ]
          : []),
        ...(hasAnyRole(['manager', 'admin'])
          ? [
              {
                title: 'Review Logs',
                url: '/logs/review',
              },
            ]
          : []),
        {
          title: 'View Logs',
          url: '/logs',
        },
      ],
    });
  }

  // Commission tracking for sales staff
  if (hasAnyRole(['sales', 'admin'])) {
    dailyOperations.push({
      title: 'Commission',
      url: '/commission',
      icon: DollarSign,
      items: [
        {
          title: 'Create Entry',
          url: '/commission/create',
        },
        {
          title: 'Track Commission',
          url: '/commission/list',
        },
      ],
    });
  }

  // Reports & Analytics - Data and insights
  const reportsAnalytics = [];

  // Employee self-service payroll (always available)
  reportsAnalytics.push({
    title: 'My Payroll',
    url: '/reports/my-payroll',
    icon: TrendingUp,
    items: [],
  });

  // Management reports for managers and admins
  if (hasAnyRole(['manager', 'admin'])) {
    reportsAnalytics.push({
      title: 'Payroll Reports',
      url: '/reports/payroll',
      icon: BarChart3,
      items: [
        {
          title: 'Current Period',
          url: '/reports/payroll',
        },
        {
          title: 'Analytics',
          url: '/reports/analytics',
        },
      ],
    });
  }

  // Administration - System management
  const administration = [];

  if (hasRole('admin')) {
    administration.push({
      title: 'User Management',
      url: '/admin/users',
      icon: Settings,
      items: [
        {
          title: 'All Users',
          url: '/admin/users',
        },
        {
          title: 'Pay Periods',
          url: '/admin/pay-periods',
        },
        {
          title: 'Audit Trail',
          url: '/admin/audit',
        },
      ],
    });
  }

  // Create teams data for team switcher (locations/franchises)
  const teams = [
    {
      name: 'College Hunks',
      logo: Building2,
      plan: 'Workforce Management',
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain title="Daily Operations" items={dailyOperations} />
        {reportsAnalytics.length > 0 && (
          <NavMain title="Reports & Analytics" items={reportsAnalytics} />
        )}
        {administration.length > 0 && (
          <NavMain title="Administration" items={administration} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
