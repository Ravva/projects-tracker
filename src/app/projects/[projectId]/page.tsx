import {
  AiBrain03Icon,
  Github01Icon,
  Note01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RunAiAnalysisButton } from "@/app/projects/[projectId]/run-ai-analysis-button";
import {
  deleteProjectAction,
  runProjectAiAnalysisAction,
  setProjectStatusAction,
  syncProjectAction,
} from "@/app/projects/actions";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownContent } from "@/components/ui/markdown-content";
import {
  getProjectBooleanMetricLabel,
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
import { parseProjectAiInputSnapshot } from "@/lib/server/project-ai-report-snapshot";
import {
  getProject,
  listProjectAiReports,
} from "@/lib/server/repositories/projects";
import { cn } from "@/lib/utils";

function extractTextOrFallback(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function getSignalToneClasses(
  tone: "critical" | "warning" | "success" | "calm",
) {
  return cn(
    "rounded-2xl border p-4",
    tone === "critical" &&
      "border-[hsl(var(--status-critical)/0.35)] bg-[hsl(var(--status-critical)/0.08)]",
    tone === "warning" &&
      "border-[hsl(var(--status-warning)/0.35)] bg-[hsl(var(--status-warning)/0.1)]",
    tone === "success" &&
      "border-[hsl(var(--status-success)/0.35)] bg-[hsl(var(--status-success)/0.08)]",
    tone === "calm" &&
      "border-[hsl(var(--status-calm)/0.35)] bg-[hsl(var(--status-calm)/0.08)]",
  );
}

function formatLastCommitLabel(
  lastCommit: string,
  lastCommitDaysAgo: number | null,
) {
  if (
    !lastCommit ||
    lastCommit === "Нет данных" ||
    lastCommitDaysAgo === null
  ) {
    return "нет данных";
  }

  const lastCommitDate = new Date(lastCommit);

  if (Number.isNaN(lastCommitDate.getTime())) {
    if (lastCommitDaysAgo < 1) {
      return "меньше часа назад";
    }

    return `${lastCommitDaysAgo} дн. назад`;
  }

  const diffMs = Date.now() - lastCommitDate.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));

  if (diffMinutes < 60) {
    return `${diffMinutes} мин. назад`;
  }

  const diffHours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)));

  if (diffHours < 24) {
    return `${diffHours} ч. назад`;
  }

  const diffDays = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)));

  return `${diffDays} дн. назад`;
}

export default async function ProjectDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    aiProvider?: string;
    error?: string;
    notice?: string;
    success?: string;
  }>;
}) {
  const teacher = await requireTeacherSession();
  const { projectId } = await params;
  const { aiProvider, error, notice, success } = await searchParams;
  const providerSuffix = aiProvider?.trim()
    ? ` (${aiProvider.trim().toUpperCase()})`
    : "";
  const [project, reports] = await Promise.all([
    getProject(projectId),
    listProjectAiReports(projectId),
  ]);

  if (!project) {
    notFound();
  }

  const latestReport = reports[0] ?? null;
  const snapshot = latestReport
    ? parseProjectAiInputSnapshot(latestReport.inputSnapshotJson)
    : null;
  const docsReadmePreview = extractTextOrFallback(
    snapshot?.memoryBank.docsReadme,
    project.hasAiAnalysisSnapshot
      ? "Архитектурный `docs/README.md` не найден в последнем AI-snapshot."
      : "Сначала запустите AI-анализ, чтобы получить `docs/README.md` из репозитория проекта.",
  );
  const productContextPreview = extractTextOrFallback(
    snapshot?.memoryBank.productContext,
    "Продуктовый контекст пока не извлечен из memory_bank.",
  );
  const activeContextPreview = extractTextOrFallback(
    snapshot?.memoryBank.activeContext,
    project.hasAiAnalysisSnapshot
      ? "Текущий контекст не найден в последнем AI-snapshot."
      : "Сначала запустите AI-анализ, чтобы получить текущий контекст из memory_bank.",
  );
  const progressContextPreview = extractTextOrFallback(
    snapshot?.memoryBank.progress,
    project.hasAiAnalysisSnapshot
      ? "Прогресс-пометки пока не найдены в последнем AI-snapshot."
      : "Сначала запустите AI-анализ, чтобы получить сигналы прогресса из memory_bank.",
  );
  const aiSummaryText = project.hasAiAnalysisSnapshot
    ? project.aiSummary || "AI summary пока не рассчитан."
    : "Данные AI-анализа пока отсутствуют. Запустите AI-анализ, чтобы получить project overview и repo signals.";
  const progressCalculationDetails =
    snapshot?.taskMetrics.progressCalculationDetails ||
    (project.hasAiAnalysisSnapshot
      ? "Подробности расчета progress не сохранены в последнем AI-snapshot."
      : "Сначала запустите AI-анализ, чтобы увидеть причину расчета progress.");
  const progressCalculationTone =
    !project.hasAiAnalysisSnapshot ||
    snapshot?.taskMetrics.progressCalculationStatus === "valid"
      ? "success"
      : "warning";
  const progressTone = !project.hasAiAnalysisSnapshot
    ? "calm"
    : project.progress >= 75
      ? "success"
      : project.progress >= 40
        ? "warning"
        : "critical";
  const riskTone = getProjectRiskTone(project);
  const activityTone = !project.hasAiAnalysisSnapshot
    ? "calm"
    : project.isAbandoned
      ? "critical"
      : project.lastCommitDaysAgo !== null && project.lastCommitDaysAgo <= 2
        ? "success"
        : "warning";
  const lastCommitLabel = formatLastCommitLabel(
    project.lastCommit,
    project.lastCommitDaysAgo,
  );

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
            <RunAiAnalysisButton />
          </form>
          <form action={setProjectStatusAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="studentId" value={project.studentId} />
            <input
              type="hidden"
              name="status"
              value={isProjectCurrent(project.status) ? "completed" : "active"}
            />
            <Button variant="outline" className="rounded-xl bg-background/90">
              {isProjectCurrent(project.status)
                ? "Отметить завершенным"
                : "Вернуть в работу"}
            </Button>
          </form>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success === "analysis-complete" ? (
        <div className="mb-6 rounded-2xl border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          AI-анализ{providerSuffix} завершен, данные проекта обновлены.
        </div>
      ) : null}
      {success === "sync-complete" ? (
        <div className="mb-6 rounded-2xl border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          GitHub sync выполнен, AI-анализ{providerSuffix} обновлен
          автоматически.
        </div>
      ) : null}
      {notice ? (
        <div className="mb-6 rounded-2xl border border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <HugeiconsIcon icon={Task01Icon} size={18} strokeWidth={1.8} />
                Прогресс и сигналы
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className={getSignalToneClasses(progressTone)}>
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
              <div className={getSignalToneClasses(riskTone)}>
                <div className="text-sm font-medium text-foreground">Риск</div>
                <div className="mt-3">
                  <StatusPill
                    tone={getProjectRiskTone(project)}
                    label={getProjectRiskLabel(project.risk)}
                  />
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Статус проекта: {getProjectStatusLabel(project.status)}
                </div>
              </div>
              <div className={getSignalToneClasses(activityTone)}>
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
                      : lastCommitLabel}
                  </div>
                </div>
              </div>
              <div
                className={getSignalToneClasses(
                  getProjectSyncStatusTone(project.syncStatus),
                )}
              >
                <div className="text-sm font-medium text-foreground">
                  Repo sync
                </div>
                <div className="mt-3">
                  <StatusPill
                    tone={getProjectSyncStatusTone(project.syncStatus)}
                    label={getProjectSyncStatusLabel(project.syncStatus)}
                  />
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {project.syncStatusReason ||
                    "Статус синхронизации пока не определен."}
                </div>
              </div>
              <div
                className={getSignalToneClasses(
                  getProjectAiStatusTone(project.aiStatus),
                )}
              >
                <div className="text-sm font-medium text-foreground">
                  AI status
                </div>
                <div className="mt-3">
                  <StatusPill
                    tone={getProjectAiStatusTone(project.aiStatus)}
                    label={getProjectAiStatusLabel(project.aiStatus)}
                  />
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {projectNeedsSync(project)
                    ? "В репозитории есть новые коммиты, поэтому текущий AI-отчет уже устарел."
                    : project.hasAiAnalysisSnapshot
                      ? "Последний AI-снимок соответствует текущему snapshot репозитория."
                      : "AI-анализ еще не запускался для этого проекта."}
                </div>
              </div>
            </CardContent>
          </Card>

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
            <CardContent className="grid gap-4">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">
                  docs/README.md
                </div>
                <div className="app-scrollbar max-h-96 overflow-y-auto pr-2">
                  <MarkdownContent content={docsReadmePreview} />
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">
                  Product context
                </div>
                <div className="app-scrollbar max-h-96 overflow-y-auto pr-2">
                  <MarkdownContent content={productContextPreview} />
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
            <CardContent className="grid gap-4">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">
                  Active context
                </div>
                <div className="app-scrollbar max-h-96 overflow-y-auto pr-2">
                  <MarkdownContent content={activeContextPreview} />
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">
                  Progress notes
                </div>
                <div className="app-scrollbar max-h-96 overflow-y-auto pr-2">
                  <MarkdownContent content={progressContextPreview} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6 self-start">
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
              <div className="app-scrollbar max-h-96 overflow-y-auto pr-2">
                <MarkdownContent content={aiSummaryText} />
              </div>
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
                    <MarkdownContent content={step} />
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
              <CardTitle className="text-base">Расчет progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className={getSignalToneClasses(progressCalculationTone)}>
                <div className="font-medium text-foreground">
                  {snapshot?.taskMetrics.progressCalculationStatus === "valid"
                    ? "Project Deliverables валиден"
                    : "Есть причина, почему progress не считается корректно"}
                </div>
                <div className="mt-2 leading-6 text-muted-foreground">
                  {progressCalculationDetails}
                </div>
                {snapshot ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Total Weight: {snapshot.taskMetrics.deliverablesWeightTotal}
                  </div>
                ) : null}
              </div>
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
                    <div className="mt-2">
                      <MarkdownContent content={report.summary} />
                    </div>
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
