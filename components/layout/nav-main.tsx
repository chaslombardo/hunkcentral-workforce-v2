"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function NavMain({
  title,
  items,
}: {
  title: string
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  if (items.length === 0) {
    return null
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-[#026937] font-medium">
          {title}
        </SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
            const hasSubItems = item.items && item.items.length > 0

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
                      className="hover:bg-[#026937]/10 data-[active=true]:bg-[#026937]/15 data-[active=true]:text-[#026937] data-[active=true]:font-medium"
                    >
                      {hasSubItems ? (
                        <div>
                          {item.icon && <item.icon className="text-[#026937]" />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-[#026937]" />
                        </div>
                      ) : (
                        <Link href={item.url}>
                          {item.icon && <item.icon className="text-[#026937]" />}
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {hasSubItems && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild 
                                isActive={isSubActive}
                                className="hover:bg-[#026937]/10 data-[active=true]:bg-[#026937]/15 data-[active=true]:text-[#026937] data-[active=true]:font-medium"
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
      <Separator className="bg-[#026937]/20" />
    </>
  )
}