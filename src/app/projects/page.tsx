import { Github01Icon, Note01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import {
  syncAllProjectsAction,
  syncProjectAction,
} from "@/app/projects/actions";
import { ProjectWeeklyStatusReportCard } from "@/app/projects/project-weekly-status-report-card";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getProjectProgressLabel,
  getProjectRiskLabel,
  getProjectRiskTone,
} from "@/lib/project-risk";
import { getProjectStatusLabel, isProjectCurrent } from "@/lib/project-status";
import {
  getProjectAiStatusLabel,
  getProjectAiStatusTone,
  getProjectSyncStatusLabel,
  getProjectSyncStatusTone,
  projectNeedsSync,
} from "@/lib/project-sync";
import { requireTeacherSession } from "@/lib/server/auth";
import { buildProjectWeeklyStatusMarkdownReport } from "@/lib/server/project-weekly-status-report";
import { listProjects } from "@/lib/server/repositories/projects";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    projectId?: string;
    success?: string;
  }>;
}) {
  const teacher = await requireTeacherSession();
  const { error, notice, projectId, success } = await searchParams;
  const projects = await listProjects();
  const currentProjects = projects.filter((project) =>
    isProjectCurrent(project.status),
  );
  const completedProjects = projects.length - currentProjects.length;
  const projectsNeedingSync = projects.filter((project) =>
    projectNeedsSync(project),
  ).length;
  const weeklyProjectStatusMarkdown =
    await buildProjectWeeklyStatusMarkdownReport();

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
          GitHub sync и автоматический AI-анализ завершены
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
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Список проектов</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ученик</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Repo sync</TableHead>
                  <TableHead>AI</TableHead>
                  <TableHead>Риск</TableHead>
                  <TableHead className="text-right">Прогресс</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Appwrite не настроен или коллекция `projects` пока пуста.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.studentName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-medium transition-colors hover:text-primary"
                          >
                            {project.name}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            Последний snapshot: {project.lastCommit}
                          </div>
                          {project.syncStatusReason ? (
                            <div className="text-xs text-muted-foreground">
                              {project.syncStatusReason}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getProjectStatusLabel(project.status)}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={getProjectSyncStatusTone(project.syncStatus)}
                          label={getProjectSyncStatusLabel(project.syncStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={getProjectAiStatusTone(project.aiStatus)}
                          label={getProjectAiStatusLabel(project.aiStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={getProjectRiskTone(project)}
                          label={getProjectRiskLabel(project.risk)}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {getProjectProgressLabel(project)}
                      </TableCell>
                      <TableCell className="text-right">
                        {projectNeedsSync(project) ? (
                          <form action={syncProjectAction}>
                            <input
                              type="hidden"
                              name="projectId"
                              value={project.id}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value="projects"
                            />
                            <Button
                              type="submit"
                              variant="outline"
                              className="rounded-xl bg-background/90"
                            >
                              Sync + AI
                            </Button>
                          </form>
                        ) : (
                          <Button
                            asChild
                            variant="ghost"
                            className="rounded-xl"
                          >
                            <Link href={`/projects/${project.id}`}>
                              Открыть
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Фокус review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon
                  icon={Github01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
                GitHub metadata
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                У ученика может быть несколько проектов: один текущий и история
                завершенных. Таблица теперь отдельно показывает, где в GitHub
                появились новые коммиты, и где AI-отчет уже устарел.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon icon={Note01Icon} size={18} strokeWidth={1.8} />
                ТЗ и план
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                Детальная страница проекта показывает краткую выборку из
                `memory_bank`: что это за проект, какой у него прогресс и какой
                сейчас текущий контекст.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6 text-muted-foreground">
              В работе сейчас {currentProjects.length} проект(а), завершено в
              истории {completedProjects}. Нужен sync для {projectsNeedingSync}{" "}
              проект(а).
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mt-6">
        <ProjectWeeklyStatusReportCard markdown={weeklyProjectStatusMarkdown} />
      </section>
    </TeacherShell>
  );
}
