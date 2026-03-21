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
  const currentProjectsByStudentId = new Map(
    projects
      .filter((project) => isProjectCurrent(project.status))
      .map((project) => [project.studentId, project] as const),
  );
  const rows = students.map((student) => ({
    studentId: student.id,
    studentName: `${student.lastName} ${student.firstName}`,
    project: currentProjectsByStudentId.get(student.id) ?? null,
  }));
  const sharePath = buildProjectReportSharePath(
    toIsoDate(startOfCurrentWeek()),
  );

  return (
    <TeacherShell
      eyebrow="Project control"
      title="Projects"
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
      {error ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success === "sync-complete" ? (
        <div className="mb-6 rounded-2xl border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          GitHub sync и автоматический AI-анализ{providerSuffix} завершены
          {projectId ? " для выбранного проекта" : ""}.
        </div>
      ) : null}
      {success === "sync-all-complete" ? (
        <div className="mb-6 rounded-2xl border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          Пакетная синхронизация завершена.
        </div>
      ) : null}
      {notice ? (
        <div className="mb-6 rounded-2xl border border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}
      <section>
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Список проектов</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectsTable rows={rows} />
          </CardContent>
        </Card>
      </section>
      <section className="mt-6">
        <ProjectWeeklyStatusReportCard sharePath={sharePath} />
      </section>
    </TeacherShell>
  );
}
