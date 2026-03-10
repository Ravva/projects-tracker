import { Github01Icon, Note01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { createProjectAction } from "@/app/projects/actions";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROJECT_FIELD_LIMITS } from "@/lib/project-limits";
import { requireTeacherSession } from "@/lib/server/auth";
import { listProjects } from "@/lib/server/repositories/projects";
import { listStudents } from "@/lib/server/repositories/students";

export default async function ProjectsPage() {
  const teacher = await requireTeacherSession();
  const [projects, students] = await Promise.all([
    listProjects(),
    listStudents(),
  ]);

  return (
    <TeacherShell
      eyebrow="Project control"
      title="Projects"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <>
          <Button variant="outline" className="rounded-xl bg-background/90">
            GitHub sync
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="#create-project">Новый проект</Link>
          </Button>
        </>
      }
    >
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
                  <TableHead>Риск</TableHead>
                  <TableHead className="text-right">Прогресс</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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
                            Последний коммит: {project.lastCommit}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{project.status}</TableCell>
                      <TableCell>
                        <StatusPill
                          tone={project.progress < 25 ? "critical" : "warning"}
                          label={project.risk}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {project.progress}%
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
            <form
              id="create-project"
              action={createProjectAction}
              className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4"
            >
              <div className="font-medium">Новый проект</div>
              <select
                name="studentId"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Выберите ученика
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
              <Input
                name="name"
                placeholder="Название проекта"
                className="rounded-xl bg-background/80"
                maxLength={PROJECT_FIELD_LIMITS.name}
                required
              />
              <Input
                name="githubUrl"
                placeholder="https://github.com/owner/repo"
                className="rounded-xl bg-background/80"
                maxLength={PROJECT_FIELD_LIMITS.githubUrl}
                required
              />
              <Input
                name="summary"
                placeholder="Краткое описание"
                className="rounded-xl bg-background/80"
                maxLength={PROJECT_FIELD_LIMITS.summary}
              />
              <select
                name="status"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                defaultValue="draft"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="review">review</option>
                <option value="done">done</option>
              </select>
              <textarea
                name="specMarkdown"
                className="min-h-24 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none"
                placeholder="ТЗ"
                maxLength={PROJECT_FIELD_LIMITS.specMarkdown}
              />
              <textarea
                name="planMarkdown"
                className="min-h-24 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none"
                placeholder="План разработки"
                maxLength={PROJECT_FIELD_LIMITS.planMarkdown}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Лимиты Appwrite: описание до {PROJECT_FIELD_LIMITS.summary}{" "}
                символов, ТЗ и план до {PROJECT_FIELD_LIMITS.specMarkdown}.
              </p>
              <Button type="submit" className="w-full rounded-xl">
                Создать проект
              </Button>
            </form>

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
                Detail page уже поддерживает teacher-only edit, sync, AI-анализ
                и override.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon icon={Note01Icon} size={18} strokeWidth={1.8} />
                ТЗ и план
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                ТЗ и план редактируются на странице проекта и валидируют
                AI-анализ.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </TeacherShell>
  );
}
