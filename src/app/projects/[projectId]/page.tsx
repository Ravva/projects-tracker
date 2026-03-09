import {
  AiBrain03Icon,
  Github01Icon,
  Note01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProject } from "@/lib/server/repositories/projects";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <TeacherShell
      eyebrow="Project review workspace"
      title={project.name}
      actions={
        <>
          <Button
            asChild
            variant="outline"
            className="rounded-xl bg-background/90"
          >
            <Link href="/projects">К списку</Link>
          </Button>
          <Button variant="outline" className="rounded-xl bg-background/90">
            GitHub sync
          </Button>
          <Button className="rounded-xl">Запустить AI-анализ</Button>
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
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
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div>Owner: {project.githubOwner}</div>
                  <div>Repo: {project.githubRepo}</div>
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
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div>Статус проекта: {project.status}</div>
                  <div>Текущий риск: {project.risk}</div>
                  <div>Ученик: {project.studentName}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <HugeiconsIcon icon={Note01Icon} size={18} strokeWidth={1.8} />
                ТЗ и план разработки
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-3 text-sm font-medium">spec_markdown</div>
                <pre className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {project.specMarkdown}
                </pre>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-3 text-sm font-medium">plan_markdown</div>
                <pre className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {project.planMarkdown}
                </pre>
              </div>
            </CardContent>
          </Card>
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
                {project.aiSummary}
              </p>
              <StatusPill
                tone={project.progress < 25 ? "critical" : "warning"}
                label={project.risk}
              />
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
            </CardContent>
          </Card>
        </div>
      </section>
    </TeacherShell>
  );
}
