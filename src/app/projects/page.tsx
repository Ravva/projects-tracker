import { Github01Icon, Note01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

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
import { requireTeacherSession } from "@/lib/server/auth";
import { listProjects } from "@/lib/server/repositories/projects";

export default async function ProjectsPage() {
  const teacher = await requireTeacherSession();
  const projects = await listProjects();

  return (
    <TeacherShell
      eyebrow="Project control"
      title="Projects"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <Button variant="outline" className="rounded-xl bg-background/90">
          GitHub sync
        </Button>
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
                          tone={getProjectRiskTone(project)}
                          label={getProjectRiskLabel(project.risk)}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {getProjectProgressLabel(project)}
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
                Проекты создаются учеником через `/my-project` после GitHub bind
                flow. Teacher-only workspace нужен для review, sync и AI-анализа
                уже подключенных репозиториев.
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
          </CardContent>
        </Card>
      </section>
    </TeacherShell>
  );
}
