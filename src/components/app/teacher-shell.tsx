"use client";

import type { CSSProperties, ReactNode } from "react";
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
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
              <div className="flex flex-col gap-4 px-5 py-4 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="rounded-xl border border-border/70 bg-background shadow-sm" />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                        {eyebrow}
                      </div>
                      <h1 className="text-2xl font-semibold tracking-tight">
                        {title}
                      </h1>
                    </div>
                  </div>
                  {actions ? (
                    <div className="flex items-center gap-2">{actions}</div>
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
