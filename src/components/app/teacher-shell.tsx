"use client";

import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { TeacherSidebar } from "@/components/app/teacher-sidebar";
import { WebGLBackground } from "@/components/app/webgl-background";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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
        setIsMobileHeaderHidden(false);
      } else if (currentScrollY > lastScrollY) {
        setIsMobileHeaderHidden(true);
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
        {/* Soft breathing radial background orbs — fixed, behind everything */}
        <WebGLBackground />

        <TeacherSidebar teacherName={teacherName} teacherEmail={teacherEmail} />

        <SidebarInset className="relative z-10 bg-transparent min-h-screen flex flex-col">
          {/* ── Sticky Luxury Header ── */}
          <header
            className={[
              "sticky top-0 z-20 transition-transform duration-200 md:translate-y-0",
              "border-b border-border/70 dark:border-border/60 bg-background/70 backdrop-blur-xl",
              isMobileHeaderHidden
                ? "-translate-y-[calc(100%+1px)]"
                : "translate-y-0",
            ].join(" ")}
          >
            {/* Elegant accent border glow line at the bottom */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 dark:via-primary/50 to-transparent opacity-60"
            />

            <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8 lg:py-4.5">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <SidebarTrigger className="rounded-xl border border-border/80 bg-background/50 hover:bg-muted/70 hover:border-border/100 backdrop-blur-sm self-center shadow-xs transition-all active:scale-95" />
                  <div className="min-w-0">
                    <div className="hidden text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground sm:block font-mono">
                      {eyebrow}
                    </div>
                    <h1 className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-xl lg:text-2xl font-title">
                      {title}
                    </h1>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2.5">
                  {actions}
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full flex-1">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
