"use client";

import {
  AiBrain03Icon,
  Book01Icon,
  Calendar03Icon,
  ChartUpIcon,
  Github01Icon,
  Notification01Icon,
  School01Icon,
  Task01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNavigation = [
  { title: "Дашборд", href: "/", icon: ChartUpIcon },
  { title: "Ученики", href: "/students", icon: User02Icon },
  { title: "Посещаемость", href: "/attendance", icon: Calendar03Icon },
  { title: "Проекты", href: "/projects", icon: Github01Icon },
];

const supportNavigation = [
  { title: "AI-отчеты", href: "/", icon: AiBrain03Icon },
  { title: "ТЗ и планы", href: "/", icon: Book01Icon },
  { title: "Уведомления", href: "/", icon: Notification01Icon },
  { title: "Контроль недели", href: "/", icon: Task01Icon },
];

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border/80 bg-sidebar/95"
    >
      <SidebarHeader className="gap-4 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[hsl(var(--status-calm))] text-white shadow-sm">
            <HugeiconsIcon icon={School01Icon} size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">
              Projects Tracker
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-sidebar-foreground/70">
              Teacher Control Room
              <Badge
                variant="outline"
                className="border-transparent bg-sidebar-accent text-[10px] tracking-[0.18em] uppercase"
              >
                MVP
              </Badge>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
                    tooltip={item.title}
                    className="h-11 rounded-xl text-sm"
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon
                        icon={item.icon}
                        size={18}
                        strokeWidth={1.8}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Рабочий поток</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="h-10 rounded-xl text-sm"
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon
                        icon={item.icon}
                        size={18}
                        strokeWidth={1.8}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-[hsl(var(--status-warning)/0.18)] font-semibold text-[hsl(var(--status-warning))]">
              RV
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium text-sidebar-foreground">
              Ravva
            </div>
            <div className="truncate text-xs text-sidebar-foreground/70">
              GitHub OAuth teacher
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
