'use client';

import * as React from 'react';
import { Bell, Calendar, Settings, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { ThemeSwitcher } from '@/components/theme-switcher';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useSession } from '@/hooks/useSession';
import { useNavigation } from '@/contexts/navigation-context';

interface AppHeaderProps {
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
  showDateRangePicker?: boolean;
}

export function AppHeader({
  breadcrumbs = [],
  showDateRangePicker = false,
}: AppHeaderProps) {
  const { user } = useSession();
  const { state } = useNavigation();
  const pathname = usePathname();

  // Check if we're on a dashboard page
  const isDashboardPage = pathname.includes('/dashboard');
  const shouldShowDatePicker = showDateRangePicker || isDashboardPage;

  // Calculate total notification count
  const notificationCount = Object.values(state.badges).reduce(
    (total, badge) => total + badge.count,
    0
  );

  // Generate initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 px-4 flex-1">
        {/* Sidebar trigger and breadcrumbs */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 text-hunks-green hover:bg-hunks-green/10" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          {breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem
                      className={index === 0 ? 'hidden md:block' : ''}
                    >
                      {breadcrumb.href ? (
                        <BreadcrumbLink
                          href={breadcrumb.href}
                          className="text-hunks-green hover:text-hunks-green/80"
                        >
                          {breadcrumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="text-foreground font-medium">
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Date Range Picker for Dashboard Pages */}
          {shouldShowDatePicker && (
            <div className="hidden md:flex items-center gap-2">
              <Calendar className="h-4 w-4 text-hunks-green" />
              <DateRangePicker />
              <Separator orientation="vertical" className="h-4" />
            </div>
          )}

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-hunks-green/10"
              >
                <Bell className="h-4 w-4 text-hunks-green" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-hunks-orange hover:bg-hunks-orange/80"
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-hunks-green">Notifications</h4>
                <Separator />
                {notificationCount > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(state.badges).map(([key, badge]) =>
                      badge.count > 0 ? (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-hunks-orange" />
                            <span className="text-sm">
                              {key === 'logs-review' && 'Logs pending review'}
                              {key === 'logs-draft' && 'Draft logs'}
                              {key === 'commission-pending' &&
                                'Pending commissions'}
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-hunks-green/10 text-hunks-green"
                          >
                            {badge.count}
                          </Badge>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No new notifications
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full hover:bg-hunks-green/10"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.fullName} />
                  <AvatarFallback className="bg-hunks-green text-white text-xs">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-hunks-green">
                    {user.fullName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user.roles.join(', ')}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-hunks-green/10">
                <User className="mr-2 h-4 w-4 text-hunks-green" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-hunks-green/10">
                <Settings className="mr-2 h-4 w-4 text-hunks-green" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-600">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
