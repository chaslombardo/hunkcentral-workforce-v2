'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import { NavigationItemWithBadge } from '@/components/layout/navigation-badge';
import { useNavigation } from '@/contexts/navigation-context';

export function NavMain({
  title,
  items,
}: {
  title: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const { state, isActiveRoute } = useNavigation();

  if (items.length === 0) {
    return null;
  }

  // Helper function to get badge info for navigation items
  const getBadgeInfo = (url: string) => {
    // Map navigation URLs to badge IDs
    const badgeMap: Record<string, string> = {
      '/logs': 'logs-review',
      '/logs/review': 'logs-review',
      '/logs/create': 'logs-draft',
      '/commission': 'commission-pending',
      '/commission/list': 'commission-pending',
    };

    const badgeId = badgeMap[url];
    if (!badgeId || !state.badges[badgeId]) {
      return { count: 0, type: 'pending' as const };
    }

    const badge = state.badges[badgeId];
    return { count: badge.count, type: badge.type };
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-hunks-green font-medium">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = isActiveRoute(item.url);
          const hasSubItems = item.items && item.items.length > 0;
          const badgeInfo = getBadgeInfo(item.url);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    asChild={!hasSubItems}
                    className="hover:bg-hunks-green/10 data-[active=true]:bg-hunks-green/15 data-[active=true]:text-hunks-green data-[active=true]:font-medium"
                  >
                    {hasSubItems ? (
                      <NavigationItemWithBadge
                        badgeCount={badgeInfo.count}
                        badgeType={badgeInfo.type}
                        className="w-full"
                      >
                        <div className="flex items-center w-full">
                          {item.icon && (
                            <item.icon className="text-hunks-green" />
                          )}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-hunks-green" />
                        </div>
                      </NavigationItemWithBadge>
                    ) : (
                      <Link href={item.url} className="w-full">
                        <NavigationItemWithBadge
                          badgeCount={badgeInfo.count}
                          badgeType={badgeInfo.type}
                          className="w-full"
                        >
                          <div className="flex items-center w-full">
                            {item.icon && (
                              <item.icon className="text-hunks-green" />
                            )}
                            <span>{item.title}</span>
                          </div>
                        </NavigationItemWithBadge>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {hasSubItems && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.url;
                        const subBadgeInfo = getBadgeInfo(subItem.url);

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className="hover:bg-hunks-green/10 data-[active=true]:bg-hunks-green/15 data-[active=true]:text-hunks-green data-[active=true]:font-medium"
                            >
                              <Link href={subItem.url} className="w-full">
                                <NavigationItemWithBadge
                                  badgeCount={subBadgeInfo.count}
                                  badgeType={subBadgeInfo.type}
                                  className="w-full"
                                >
                                  <span>{subItem.title}</span>
                                </NavigationItemWithBadge>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
