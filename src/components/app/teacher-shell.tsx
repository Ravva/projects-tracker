"use client";

import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { TeacherSidebar } from "@/components/app/teacher-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function TeacherShell({
  eyebrow,
  title,
  actions,
  teacherName,
  teacherEmail,
  children,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  teacherName: string;
  teacherEmail: string;
  children: ReactNode;
}) {
  const [isMobileHeaderHidden, setIsMobileHeaderHidden] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!mediaQuery.matches) {
        setIsMobileHeaderHidden(false);
        lastScrollY = window.scrollY;
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY <= 12) {
        setIsMobileHeaderHidden(false);
      } else if (currentScrollY < lastScrollY) {
        setIsMobileHeaderHidden(true);
      } else if (currentScrollY > lastScrollY) {
        setIsMobileHeaderHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    const handleViewportChange = () => {
      if (!mediaQuery.matches) {
        setIsMobileHeaderHidden(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  return (
    <TooltipProvider delayDuration={120}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--sidebar-width-icon": "4.5rem",
          } as CSSProperties
        }
      >
        <TeacherSidebar teacherName={teacherName} teacherEmail={teacherEmail} />
        <SidebarInset className="bg-transparent">
          <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))]">
            <header
              className={`sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl transition-transform duration-200 md:translate-y-0 ${isMobileHeaderHidden ? "-translate-y-[calc(100%+1px)]" : "translate-y-0"}`}
            >
              <div className="flex flex-col gap-2 px-4 py-2.5 sm:px-5 sm:py-3 lg:px-8 lg:py-4">
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <SidebarTrigger className="rounded-xl border border-border/70 bg-background shadow-sm" />
                    <div className="min-w-0">
                      <div className="hidden text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground sm:block">
                        {eyebrow}
                      </div>
                      <h1 className="truncate text-base font-semibold tracking-tight sm:text-xl lg:text-2xl">
                        {title}
                      </h1>
                    </div>
                  </div>
                  {actions ? (
                    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                      {actions}
                    </div>
                  ) : null}
                </div>
              </div>
            </header>

            <main className="px-5 py-6 lg:px-8">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
