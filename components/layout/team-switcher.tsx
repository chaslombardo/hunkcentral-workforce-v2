'use client';

import * as React from 'react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const activeTeam = teams[0]; // Always use the first (and only) team

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default">
          <div className="bg-hunks-green text-white flex aspect-square size-8 items-center justify-center rounded-lg">
            <activeTeam.logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-hunks-green">
              {activeTeam.name}
            </span>
            <span className="truncate text-xs font-medium text-hunks-orange">
              {activeTeam.plan}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
