"use client";

import {
  Calendar03Icon,
  Github01Icon,
  Logout01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/app/brand-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavigation = [
  { title: "Ученики", href: "/students", icon: User02Icon },
  { title: "Посещаемость", href: "/attendance", icon: Calendar03Icon },
  { title: "Проекты", href: "/projects", icon: Github01Icon },
];

export function TeacherSidebar({
  teacherName,
  teacherEmail,
}: {
  teacherName: string;
  teacherEmail: string;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const initials = teacherName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("");

  const handleMobileNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border/80 bg-sidebar/95"
    >
      <SidebarHeader className="gap-4 px-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/"
            onClick={handleMobileNavigation}
            className="flex flex-1 shrink-0 items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl shadow-sm">
              <BrandMark className="size-11 rounded-2xl" />
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
          {isMobile ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-xl"
              onClick={() => setOpenMobile(false)}
            >
              Скрыть
            </Button>
          ) : null}
        </div>
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
                    <Link href={item.href} onClick={handleMobileNavigation}>
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

      <SidebarFooter className="px-3 pb-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-3 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
          <Avatar size="lg">
            <AvatarFallback className="bg-[hsl(var(--status-warning)/0.18)] font-semibold text-[hsl(var(--status-warning))]">
              {initials || "TC"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium text-sidebar-foreground">
              {teacherName}
            </div>
            <div className="truncate text-xs text-sidebar-foreground/70">
              {teacherEmail || "GitHub OAuth teacher"}
            </div>
          </div>
        </div>
        <a
          href="/api/auth/signout"
          onClick={handleMobileNavigation}
          className="mt-3 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={1.8} />
          <span className="group-data-[collapsible=icon]:hidden">Выйти</span>
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
