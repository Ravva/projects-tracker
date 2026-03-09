import {
  AiBrain03Icon,
  Github01Icon,
  Note01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  clearProjectOverrideAction,
  deleteProjectAction,
  runProjectAiAnalysisAction,
  setProjectOverrideAction,
  syncProjectAction,
  updateProjectAction,
} from "@/app/projects/actions";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireTeacherSession } from "@/lib/server/auth";
import {
  getProject,
  listProjectAiReports,
} from "@/lib/server/repositories/projects";
import { listStudents } from "@/lib/server/repositories/students";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const teacher = await requireTeacherSession();
  const { projectId } = await params;
  const [project, reports, students] = await Promise.all([
    getProject(projectId),
    listProjectAiReports(projectId),
    listStudents(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <TeacherShell
      eyebrow="Project review workspace"
      title={project.name}
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <>
          <Button
            asChild
            variant="outline"
            className="rounded-xl bg-background/90"
          >
            <Link href="/projects">К списку</Link>
          </Button>
          <form action={syncProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <Button variant="outline" className="rounded-xl bg-background/90">
              GitHub sync
            </Button>
          </form>
          <form action={runProjectAiAnalysisAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <Button className="rounded-xl">Запустить AI-анализ</Button>
          </form>
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <form action={updateProjectAction} className="grid gap-6">
            <input type="hidden" name="projectId" value={project.id} />
            <Card className="border-border/70 bg-card/88 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  Overview
                  <StatusPill
                    tone={project.progress < 25 ? "critical" : "warning"}
                    label={`${project.progress}%`}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center gap-3 font-medium">
                    <HugeiconsIcon
                      icon={Github01Icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                    GitHub metadata
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <Input
                      name="githubUrl"
                      defaultValue={project.githubUrl}
                      className="rounded-xl bg-background/80"
                    />
                    <div>Owner: {project.githubOwner || "не определен"}</div>
                    <div>Repo: {project.githubRepo || "не определен"}</div>
                    <div>Default branch: {project.defaultBranch}</div>
                    <div>Последний коммит: {project.lastCommit}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center gap-3 font-medium">
                    <HugeiconsIcon
                      icon={Task01Icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                    Review status
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                    <Input
                      name="name"
                      defaultValue={project.name}
                      className="rounded-xl bg-background/80"
                    />
                    <Input
                      name="summary"
                      defaultValue={project.summary}
                      className="rounded-xl bg-background/80"
                    />
                    <select
                      name="studentId"
                      defaultValue={project.studentId}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                        </option>
                      ))}
                    </select>
                    <select
                      name="status"
                      defaultValue={project.status}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="review">review</option>
                      <option value="done">done</option>
                    </select>
                    <div>Текущий риск: {project.risk}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/88 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <HugeiconsIcon
                    icon={Note01Icon}
                    size={18}
                    strokeWidth={1.8}
                  />
                  ТЗ и план разработки
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="mb-3 text-sm font-medium">spec_markdown</div>
                  <textarea
                    name="specMarkdown"
                    className="min-h-64 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm leading-6 text-muted-foreground outline-none"
                    defaultValue={project.specMarkdown}
                  />
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="mb-3 text-sm font-medium">plan_markdown</div>
                  <textarea
                    name="planMarkdown"
                    className="min-h-64 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm leading-6 text-muted-foreground outline-none"
                    defaultValue={project.planMarkdown}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" className="rounded-xl">
                Сохранить проект
              </Button>
            </div>
          </form>
        </div>

        <div className="grid gap-6">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <HugeiconsIcon
                  icon={AiBrain03Icon}
                  size={18}
                  strokeWidth={1.8}
                />
                AI summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="leading-7 text-muted-foreground">
                {project.aiSummary || "AI summary пока не рассчитан."}
              </p>
              <StatusPill
                tone={project.progress < 25 ? "critical" : "warning"}
                label={project.risk}
              />
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="text-sm font-medium">Ручной override</div>
                <form
                  action={setProjectOverrideAction}
                  className="mt-3 space-y-3"
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <Input
                    name="manualCompletionPercent"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={
                      project.manualCompletionPercent ?? project.progress
                    }
                    className="rounded-xl bg-background/80"
                  />
                  <textarea
                    name="manualOverrideNote"
                    className="min-h-24 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none"
                    defaultValue={project.manualOverrideNote}
                    placeholder="Комментарий override"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="rounded-xl">
                      Применить override
                    </Button>
                  </div>
                </form>
                <form action={clearProjectOverrideAction} className="mt-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="rounded-xl bg-background/90"
                  >
                    Сбросить override
                  </Button>
                </form>
              </div>
              <form action={deleteProjectAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <Button
                  variant="outline"
                  className="rounded-xl bg-background/90"
                >
                  Удалить проект
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Next steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {project.nextSteps.map((step) => (
                <div
                  key={step}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6 text-muted-foreground"
                >
                  {step}
                </div>
              ))}
              {project.nextSteps.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6 text-muted-foreground">
                  После первого AI-анализа здесь появятся следующие шаги.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">История AI-отчетов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4"
                >
                  <div className="font-medium">
                    {report.completionPercent}% • {report.createdAt}
                  </div>
                  <p className="mt-2 leading-6 text-muted-foreground">
                    {report.summary}
                  </p>
                </div>
              ))}
              {reports.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6 text-muted-foreground">
                  История AI-отчетов пока пуста.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </TeacherShell>
  );
}
