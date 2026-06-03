import type React from "react";
import { syncAllProjectsAction } from "@/app/projects/actions";
import { ProjectWeeklyStatusReportCard } from "@/app/projects/project-weekly-status-report-card";
import { ProjectsTable } from "@/app/projects/projects-table";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isProjectCurrent } from "@/lib/project-status";
import { projectNeedsSync } from "@/lib/project-sync";
import { requireTeacherSession } from "@/lib/server/auth";
import { startOfCurrentWeek, toIsoDate } from "@/lib/server/date-utils";
import { buildProjectReportSharePath } from "@/lib/server/project-report-share";
import { listProjects } from "@/lib/server/repositories/projects";
import { listStudents } from "@/lib/server/repositories/students";

function AlertBanner({
  tone,
  children,
}: {
  tone: "success" | "error" | "warning";
  children: React.ReactNode;
}) {
  const config = {
    success: {
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.25)",
      iconColor: "hsl(160 60% 48%)",
      icon: "✓",
    },
    error: {
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.25)",
      iconColor: "hsl(8 79% 66%)",
      icon: "✕",
    },
    warning: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      iconColor: "hsl(37 88% 61%)",
      icon: "!",
    },
  }[tone];

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <span
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: config.border, color: config.iconColor }}
      >
        {config.icon}
      </span>
      <span className="text-foreground/90 leading-6">{children}</span>
    </div>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    aiProvider?: string;
    error?: string;
    notice?: string;
    projectId?: string;
    success?: string;
  }>;
}) {
  const teacher = await requireTeacherSession();
  const { aiProvider, error, notice, projectId, success } = await searchParams;
  const providerSuffix = aiProvider?.trim()
    ? ` (${aiProvider.trim().toUpperCase()})`
    : "";
  const [projects, students] = await Promise.all([
    listProjects(),
    listStudents(),
  ]);
  const projectsNeedingSync = projects.filter((project) =>
    projectNeedsSync(project),
  ).length;
  const currentProjects = projects.filter((project) =>
    isProjectCurrent(project.status),
  );
  const currentProjectsByStudentId = new Map(
    currentProjects.flatMap((project) =>
      project.memberStudentIds.map(
        (studentId) => [studentId, project] as const,
      ),
    ),
  );
  const rows = students
    .map((student) => {
      const studentName = `${student.lastName} ${student.firstName}`;
      const project = currentProjectsByStudentId.get(student.id) ?? null;

      return {
        studentId: student.id,
        studentName,
        project,
      };
    })
    .sort((left, right) =>
      left.studentName.localeCompare(right.studentName, "ru"),
    );
  const sharePath = buildProjectReportSharePath(
    toIsoDate(startOfCurrentWeek()),
  );

  return (
    <TeacherShell
      eyebrow="Управление проектами"
      title="Проекты"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <div className="flex items-center gap-3">
          <StatusPill
            tone={projectsNeedingSync > 0 ? "warning" : "success"}
            label={
              projectsNeedingSync > 0
                ? `${projectsNeedingSync} нужен sync`
                : "repo актуальны"
            }
          />
          <form action={syncAllProjectsAction}>
            <Button
              type="submit"
              variant="outline"
              className="rounded-xl bg-background/90"
              disabled={projectsNeedingSync === 0}
            >
              Синхронизировать все
            </Button>
          </form>
        </div>
      }
    >
      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
      {success === "sync-complete" ? (
        <AlertBanner tone="success">
          GitHub sync и автоматический AI-анализ{providerSuffix} завершены
          {projectId ? " для выбранного проекта" : ""}.
        </AlertBanner>
      ) : null}
      {success === "sync-complete-with-warning" ? (
        <AlertBanner tone="success">
          GitHub sync выполнен{projectId ? " для выбранного проекта" : ""}.
        </AlertBanner>
      ) : null}
      {success === "sync-all-complete" ? (
        <AlertBanner tone="success">
          Пакетная синхронизация завершена.
        </AlertBanner>
      ) : null}
      {notice ? <AlertBanner tone="warning">{notice}</AlertBanner> : null}
      <section className="min-w-0 w-full">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Список проектов</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectsTable rows={rows} />
          </CardContent>
        </Card>
      </section>
      <section className="min-w-0 w-full mt-6">
        <ProjectWeeklyStatusReportCard sharePath={sharePath} />
      </section>
    </TeacherShell>
  );
}
