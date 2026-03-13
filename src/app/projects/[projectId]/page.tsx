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
  deleteProjectAction,
  runProjectAiAnalysisAction,
  syncProjectAction,
} from "@/app/projects/actions";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProjectBooleanMetricLabel,
  getProjectProgressLabel,
  getProjectRiskLabel,
  getProjectRiskTone,
} from "@/lib/project-risk";
import { requireTeacherSession } from "@/lib/server/auth";
import {
  getProject,
  listProjectAiReports,
} from "@/lib/server/repositories/projects";

type ProjectSnapshotPreview = {
  memoryBankPreview?: {
    projectBrief?: string;
    productContext?: string;
    activeContext?: string;
    progress?: string;
    docsReadme?: string;
  };
};

function parseInputSnapshotPreview(rawJson: string) {
  try {
    return JSON.parse(rawJson) as ProjectSnapshotPreview;
  } catch {
    return {};
  }
}

function extractTextOrFallback(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const teacher = await requireTeacherSession();
  const { projectId } = await params;
  const [project, reports] = await Promise.all([
    getProject(projectId),
    listProjectAiReports(projectId),
  ]);

  if (!project) {
    notFound();
  }

  const latestReport = reports[0] ?? null;
  const snapshotPreview = latestReport
    ? parseInputSnapshotPreview(latestReport.inputSnapshotJson)
    : {};
  const projectBriefPreview = extractTextOrFallback(
    snapshotPreview.memoryBankPreview?.projectBrief,
    project.summary || "Краткое описание проекта пока отсутствует.",
  );
  const productContextPreview = extractTextOrFallback(
    snapshotPreview.memoryBankPreview?.productContext,
    "Продуктовый контекст пока не извлечен из memory_bank.",
  );
  const activeContextPreview = extractTextOrFallback(
    snapshotPreview.memoryBankPreview?.activeContext,
    project.hasAiAnalysisSnapshot
      ? "Текущий контекст не найден в последнем AI-snapshot."
      : "Сначала запустите AI-анализ, чтобы получить текущий контекст из memory_bank.",
  );
  const progressContextPreview = extractTextOrFallback(
    snapshotPreview.memoryBankPreview?.progress,
    project.hasAiAnalysisSnapshot
      ? "Прогресс-пометки пока не найдены в последнем AI-snapshot."
      : "Сначала запустите AI-анализ, чтобы получить сигналы прогресса из memory_bank.",
  );
  const aiSummaryText = project.hasAiAnalysisSnapshot
    ? project.aiSummary || "AI summary пока не рассчитан."
    : "Данные AI-анализа пока отсутствуют. Запустите AI-анализ, чтобы получить project overview и repo signals.";

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
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                Что это за проект
                <StatusPill
                  tone={getProjectRiskTone(project)}
                  label={getProjectProgressLabel(project)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">
                  Project brief
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {projectBriefPreview}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">
                  Product context
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {productContextPreview}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <HugeiconsIcon icon={Task01Icon} size={18} strokeWidth={1.8} />
                Прогресс и сигналы
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="text-sm font-medium text-foreground">
                  Выполнение
                </div>
                <div className="mt-3 text-3xl font-semibold text-foreground">
                  {project.progress}%
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {project.trackedTasksCompleted}/{project.trackedTasksTotal}{" "}
                  deliverables завершено
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="text-sm font-medium text-foreground">Риск</div>
                <div className="mt-3">
                  <StatusPill
                    tone={getProjectRiskTone(project)}
                    label={getProjectRiskLabel(project.risk)}
                  />
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Статус проекта: {project.status}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="text-sm font-medium text-foreground">
                  Активность
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <div>Коммитов в выборке: {project.commitCount}</div>
                  <div>Частота: {project.commitsPerWeek}/нед</div>
                  <div>
                    Последний коммит:{" "}
                    {project.lastCommitDaysAgo === null
                      ? "нет данных"
                      : `${project.lastCommitDaysAgo} дн. назад`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <HugeiconsIcon icon={Note01Icon} size={18} strokeWidth={1.8} />
                Текущий контекст
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">
                  Active context
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {activeContextPreview}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">
                  Progress notes
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {progressContextPreview}
                </p>
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
              <p className="leading-7 text-muted-foreground">{aiSummaryText}</p>
              <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">
                  Репозиторий и memory signals
                </div>
                <div>Ученик: {project.studentName}</div>
                <div>
                  GitHub:{" "}
                  <Link
                    href={project.githubUrl}
                    className="text-primary underline-offset-4 hover:underline"
                    target="_blank"
                  >
                    {project.githubOwner && project.githubRepo
                      ? `${project.githubOwner}/${project.githubRepo}`
                      : project.githubUrl}
                  </Link>
                </div>
                <div>
                  Репозиторий:{" "}
                  {project.hasRepository ? "подключен" : "не найден"}
                </div>
                <div>
                  memory_bank:{" "}
                  {getProjectBooleanMetricLabel(
                    project,
                    project.hasMemoryBank,
                    {
                      positive: "обнаружен",
                      negative: "отсутствует",
                    },
                  )}
                </div>
                <div>
                  ТЗ:{" "}
                  {getProjectBooleanMetricLabel(project, project.hasSpec, {
                    positive: "есть",
                    negative: "нет",
                  })}
                </div>
                <div>
                  План:{" "}
                  {getProjectBooleanMetricLabel(project, project.hasPlan, {
                    positive: "есть",
                    negative: "нет",
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Следующие шаги</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {project.nextSteps.length > 0 ? (
                project.nextSteps.map((step) => (
                  <div
                    key={step}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6 text-muted-foreground"
                  >
                    {step}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6 text-muted-foreground">
                  После AI-анализа здесь появятся следующие шаги по проекту.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <HugeiconsIcon
                  icon={Github01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
                История AI-отчетов
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4"
                  >
                    <div className="font-medium">
                      {report.completionPercent}% • {report.createdAt}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      memory_bank: {report.hasMemoryBank ? "да" : "нет"} • ТЗ:{" "}
                      {report.hasSpec ? "да" : "нет"} • План:{" "}
                      {report.hasPlan ? "да" : "нет"}
                    </div>
                    <p className="mt-2 leading-6 text-muted-foreground">
                      {report.summary}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6 text-muted-foreground">
                  История AI-отчетов пока пуста.
                </div>
              )}
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
        </div>
      </section>
    </TeacherShell>
  );
}
