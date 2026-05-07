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
      className="border-r border-white/5"
      style={{
        background:
          "linear-gradient(180deg, rgba(14,17,26,0.68) 0%, rgba(12,15,23,0.72) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <SidebarHeader className="gap-4 px-3 py-4">
        <div className="flex items-start justify-between gap-3">
          {/* Logo tile — gradient-border shell */}
          <Link
            href="/"
            onClick={handleMobileNavigation}
            className="gradient-border flex flex-1 shrink-0 items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 hover:bg-white/5 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex size-11 items-center justify-center rounded-2xl">
              <BrandMark className="size-11 rounded-2xl" />
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">
                Projects Tracker
              </div>
              <div
                className="mt-1 flex items-center gap-2 text-xs"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Teacher Control Room
                <Badge
                  variant="outline"
                  className="border-transparent text-[10px] tracking-[0.18em] uppercase"
                  style={{
                    background: "rgba(6,182,212,0.12)",
                    color: "hsl(189 94% 43%)",
                    borderColor: "rgba(6,182,212,0.2)",
                  }}
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
          <SidebarGroupLabel
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
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
                      className="h-11 rounded-xl text-sm transition-all duration-200"
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(20,184,166,0.12) 100%)",
                              border: "1px solid rgba(6,182,212,0.25)",
                              color: "hsl(189 94% 43%)",
                              boxShadow: "0 0 16px rgba(6,182,212,0.2)",
                            }
                          : {
                              border: "1px solid transparent",
                            }
                      }
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
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        {/* User tile */}
        <div
          className="flex shrink-0 items-center gap-3 rounded-2xl px-3 py-3 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Avatar size="lg">
            <AvatarFallback
              className="font-semibold text-sm"
              style={{
                background: "rgba(6,182,212,0.15)",
                color: "hsl(189 94% 43%)",
              }}
            >
              {initials || "TC"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div
              className="truncate text-sm font-medium"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            >
              {teacherName}
            </div>
            <div
              className="truncate text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {teacherEmail || "GitHub OAuth teacher"}
            </div>
          </div>
        </div>

        {/* Logout */}
        <a
          href="/api/auth/signout"
          onClick={handleMobileNavigation}
          className="mt-3 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "hsl(var(--muted-foreground))",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = "rgba(6,182,212,0.08)";
            el.style.borderColor = "rgba(6,182,212,0.2)";
            el.style.color = "hsl(189 94% 43%)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = "rgba(255,255,255,0.03)";
            el.style.borderColor = "rgba(255,255,255,0.07)";
            el.style.color = "hsl(var(--muted-foreground))";
          }}
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={1.8} />
          <span className="group-data-[collapsible=icon]:hidden">Выйти</span>
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
