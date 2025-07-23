// Sidebar navigation component
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';
import { getNavigationForRoles } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  if (!user) return null;

  const navigation = getNavigationForRoles(user.roles);

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      pathname === item.href && "bg-secondary"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      {item.title}
                    </Link>
                  </Button>
                  {item.children && item.children.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Button
                          key={child.href}
                          variant={pathname === child.href ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start",
                            pathname === child.href && "bg-secondary"
                          )}
                          asChild
                        >
                          <Link href={child.href}>
                            {child.title}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}