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
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="gap-4 px-3 py-4">
        <div className="flex items-start justify-between gap-3">
          {/* Logo tile — gradient-border shell */}
          <Link
            href="/"
            onClick={handleMobileNavigation}
            className="flex flex-1 shrink-0 items-center gap-3 rounded-2xl p-2 md:p-2.5 transition-all duration-200 hover:bg-card/80 border border-border/40 dark:border-border/20 bg-card/30 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shadow-xs">
              <BrandMark className="size-10 rounded-xl" />
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-extrabold text-foreground tracking-tight">
                Projects Tracker
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase font-mono tracking-wider">
                Teacher Room
                <Badge
                  variant="outline"
                  className="px-1 py-0 border-primary/20 bg-primary/10 text-primary text-[8px] tracking-[0.16em] uppercase font-bold"
                >
                  MVP
                </Badge>
              </div>
            </div>
          </Link>

          {isMobile ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="shrink-0 rounded-lg text-xs"
              onClick={() => setOpenMobile(false)}
            >
              Скрыть
            </Button>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-1.5 font-mono">
            Навигация
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-11 rounded-xl text-sm transition-all duration-200 font-semibold px-3 ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-xs shadow-primary/5"
                          : "text-foreground/80 hover:bg-muted/70 hover:text-foreground border border-transparent"
                      }`}
                    >
                      <Link href={item.href} onClick={handleMobileNavigation}>
                        <HugeiconsIcon
                          icon={item.icon}
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          }
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        {/* User tile */}
        <div className="flex shrink-0 items-center gap-3 rounded-2xl p-2 md:p-2.5 border border-border/40 dark:border-border/20 bg-card/30 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
          <Avatar className="size-9 rounded-xl border border-primary/15 shrink-0">
            <AvatarFallback className="font-extrabold text-xs bg-primary/10 text-primary font-mono rounded-xl">
              {initials || "TC"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-xs font-bold text-foreground">
              {teacherName}
            </div>
            <div className="truncate text-[10px] text-muted-foreground font-medium">
              {teacherEmail || "GitHub OAuth Teacher"}
            </div>
          </div>
        </div>

        {/* Logout */}
        <a
          href="/api/auth/signout"
          onClick={handleMobileNavigation}
          className="mt-3 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground border border-border/50 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0"
        >
          <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={2} />
          <span className="group-data-[collapsible=icon]:hidden">Выйти</span>
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
