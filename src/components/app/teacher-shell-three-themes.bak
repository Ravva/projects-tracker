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
        {/* WebGL dot-matrix background — fixed, behind everything */}
        <WebGLBackground />

        <TeacherSidebar teacherName={teacherName} teacherEmail={teacherEmail} />

        <SidebarInset className="relative z-10 bg-transparent">
          <div className="min-h-screen">
            {/* ── Sticky glass header ── */}
            <header
              className={[
                "gradient-border sticky top-0 z-20 transition-transform duration-200 md:translate-y-0",
                isMobileHeaderHidden
                  ? "-translate-y-[calc(100%+1px)]"
                  : "translate-y-0",
              ].join(" ")}
              style={{
                background: "rgba(11, 14, 22, 0.18)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 0,
              }}
            >
              {/* Gradient border accent line at bottom */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(6,182,212,0.5) 30%, rgba(20,184,166,0.4) 70%, transparent)",
                }}
              />

              <div className="flex flex-col gap-2 px-4 py-2.5 sm:px-5 sm:py-3 lg:px-8 lg:py-4">
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <SidebarTrigger
                      className="rounded-xl border border-white/8 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/12"
                      style={{
                        boxShadow: "0 0 0 1px rgba(6,182,212,0.08)",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:block">
                        {eyebrow}
                      </div>
                      <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-xl lg:text-2xl">
                        {title}
                      </h1>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                    {actions}
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </header>

            <main className="px-5 py-5 lg:px-8 max-w-[1600px] mx-auto w-full">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
