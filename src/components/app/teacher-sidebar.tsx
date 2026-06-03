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
      <SidebarHeader className="gap-3 px-2 py-3">
        <div className="flex items-center justify-between gap-2.5">
          {/* Logo tile — compact gradient border shell */}
          <Link
            href="/"
            onClick={handleMobileNavigation}
            className="flex flex-1 shrink-0 items-center gap-2 rounded-lg p-1.5 transition-all duration-200 hover:bg-card/85 border border-border/30 dark:border-border/15 bg-card/20 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <BrandMark className="size-7 rounded-lg" />
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-xs font-bold text-foreground tracking-tight">
                Projects Tracker
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-muted-foreground uppercase font-sans tracking-wide">
                Teacher Room
                <Badge
                  variant="outline"
                  className="px-0.5 py-0 border-primary/10 bg-primary/5 text-primary text-[7px] font-bold"
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
          <SidebarGroupLabel className="text-[9px] uppercase tracking-wider text-muted-foreground px-2.5 py-1 block mb-0.5">
            Меню
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
                      className={`h-9 rounded-lg text-xs transition-all duration-200 font-semibold px-2.5 ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/25 shadow-xs"
                          : "text-foreground/80 hover:bg-muted/65 hover:text-foreground border border-transparent"
                      }`}
                    >
                      <Link href={item.href} onClick={handleMobileNavigation}>
                        <HugeiconsIcon
                          icon={item.icon}
                          size={14}
                          strokeWidth={isActive ? 2 : 1.6}
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

      <SidebarFooter className="px-2 pb-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        {/* User tile */}
        <div className="flex shrink-0 items-center gap-2 rounded-lg p-1.5 border border-border/30 dark:border-border/15 bg-card/20 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
          <Avatar className="size-7 rounded-lg border border-primary/15 shrink-0">
            <AvatarFallback className="font-extrabold text-[9px] bg-primary/10 text-primary font-mono rounded-lg">
              {initials || "TC"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-[11px] font-bold text-foreground">
              {teacherName}
            </div>
            <div className="truncate text-[9px] text-muted-foreground font-medium">
              {teacherEmail || "GitHub OAuth Teacher"}
            </div>
          </div>
        </div>

        {/* Logout */}
        <a
          href="/api/auth/signout"
          onClick={handleMobileNavigation}
          className="mt-2 inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg px-2.5 py-1 text-[10px] font-bold font-sans uppercase tracking-wider text-muted-foreground border border-border/40 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:p-0"
        >
          <HugeiconsIcon icon={Logout01Icon} size={14} strokeWidth={1.8} />
          <span className="group-data-[collapsible=icon]:hidden">Выйти</span>
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
