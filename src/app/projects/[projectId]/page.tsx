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
import { SyncProjectButton } from "@/app/projects/[projectId]/sync-project-button";
import {
  addProjectMemberAction,
  deleteProjectAction,
  removeProjectMemberAction,
  runProjectAiAnalysisAction,
  setProjectGroupModeAction,
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
import { isProjectCurrent } from "@/lib/project-status";
import {
  getProjectAiStatusLabel,
  getProjectAiStatusTone,
  getProjectSyncStatusLabel,
  getProjectSyncStatusTone,
} from "@/lib/project-sync";
import { requireTeacherSession } from "@/lib/server/auth";
import { formatDateTimeShort } from "@/lib/server/date-utils";
import { getUploadedLogsMetadata } from "@/lib/server/logs-storage";
import { parseProjectAiInputSnapshot } from "@/lib/server/project-ai-report-snapshot";
import {
  getProject,
  listProjectAiReports,
  listProjectMembers,
} from "@/lib/server/repositories/projects";
import { listStudents } from "@/lib/server/repositories/students";

function extractTextOrFallback(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

type SignalTone = "critical" | "warning" | "success" | "calm";

const signalToneConfig: Record<
  SignalTone,
  { bg: string; border: string; glow: string; line: string; text: string }
> = {
  critical: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.22)",
    glow: "rgba(239,68,68,0.12)",
    line: "rgba(239,68,68,0.5)",
    text: "hsl(var(--status-critical))",
  },
  warning: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.22)",
    glow: "rgba(245,158,11,0.12)",
    line: "rgba(245,158,11,0.5)",
    text: "hsl(var(--status-warning))",
  },
  success: {
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.22)",
    glow: "rgba(34,197,94,0.12)",
    line: "rgba(34,197,94,0.5)",
    text: "hsl(var(--status-success))",
  },
  calm: {
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.22)",
    glow: "rgba(6,182,212,0.12)",
    line: "rgba(6,182,212,0.5)",
    text: "hsl(var(--status-calm))",
  },
};

function SignalCard({
  tone,
  title,
  value,
  children,
}: {
  tone: SignalTone;
  title: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const c = signalToneConfig[tone];
  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg p-4 transition-all duration-200 border border-white/5 bg-background/40">
      {/* Top accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.line} 50%, transparent)`,
        }}
      />
      <div
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {title}
      </div>
      {value !== undefined && (
        <div
          className="mt-2.5 text-2xl font-bold leading-none tracking-tight"
          style={{ color: c.text }}
        >
          {value}
        </div>
      )}
      {children && (
        <div className="mt-auto space-y-1 pt-2.5 text-xs text-muted-foreground">
          {children}
        </div>
      )}
    </div>
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
  const [project, reports, logsMetadata] = await Promise.all([
    getProject(projectId),
    listProjectAiReports(projectId),
    getUploadedLogsMetadata(projectId),
  ]);

  if (!project) {
    notFound();
  }

  const [members, students] = await Promise.all([
    listProjectMembers(projectId),
    listStudents(),
  ]);
  const availableStudents = students.filter(
    (student) => !project.memberStudentIds.includes(student.id),
  );

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
            size="sm"
            className="bg-background/90"
          >
            <Link href="/projects">К списку</Link>
          </Button>
          <form action={syncProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <SyncProjectButton />
          </form>
          <form action={runProjectAiAnalysisAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <RunAiAnalysisButton />
          </form>
          <form action={setProjectStatusAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <input
              type="hidden"
              name="status"
              value={isProjectCurrent(project.status) ? "completed" : "active"}
            />
            <Button variant="outline" size="sm" className="bg-background/90">
              {isProjectCurrent(project.status)
                ? "Отметить завершенным"
                : "Вернуть в работу"}
            </Button>
          </form>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success === "analysis-complete" ? (
        <div className="mb-6 rounded-lg border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          AI-анализ{providerSuffix} завершен, данные проекта обновлены.
        </div>
      ) : null}
      {success === "member-added" ? (
        <div className="mb-6 rounded-lg border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          Участник добавлен в проект.
        </div>
      ) : null}
      {success === "member-removed" ? (
        <div className="mb-6 rounded-lg border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          Участник удален из проекта.
        </div>
      ) : null}
      {success === "sync-complete" ? (
        <div className="mb-6 rounded-lg border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          GitHub sync выполнен, AI-анализ{providerSuffix} обновлен
          автоматически.
        </div>
      ) : null}
      {success === "sync-complete-with-warning" ? (
        <div className="mb-6 rounded-lg border border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)] px-4 py-3 text-sm text-foreground">
          GitHub sync выполнен.
        </div>
      ) : null}
      {notice ? (
        <div className="mb-6 rounded-lg border border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] w-full min-w-0">
        <div className="min-w-0 w-full grid gap-6">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <HugeiconsIcon icon={Task01Icon} size={18} strokeWidth={1.8} />
                Прогресс и сигналы
              </CardTitle>
            </CardHeader>
            <CardContent className="auto-rows-fr grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SignalCard
                tone={progressTone}
                title="Выполнение"
                value={`${project.progress}%`}
              >
                <div>
                  {project.trackedTasksCompleted}/{project.trackedTasksTotal}{" "}
                  завершено
                </div>
              </SignalCard>
              <SignalCard tone={riskTone} title="Риск">
                <StatusPill
                  tone={getProjectRiskTone(project)}
                  label={getProjectRiskLabel(project.risk)}
                />
              </SignalCard>
              <SignalCard tone={activityTone} title="Активность">
                <div>Коммитов: {project.commitCount}</div>
                <div>Частота: {project.commitsPerWeek}/нед</div>
                <div>
                  {project.lastCommitDaysAgo === null
                    ? "Последний: нет данных"
                    : `Последний: ${lastCommitLabel}`}
                </div>
              </SignalCard>
              <SignalCard
                tone={getProjectSyncStatusTone(project.syncStatus)}
                title="Repo sync"
              >
                <StatusPill
                  tone={getProjectSyncStatusTone(project.syncStatus)}
                  label={getProjectSyncStatusLabel(project.syncStatus)}
                />
              </SignalCard>
              <SignalCard
                tone={getProjectAiStatusTone(project.aiStatus)}
                title="AI analysis"
              >
                <StatusPill
                  tone={getProjectAiStatusTone(project.aiStatus)}
                  label={getProjectAiStatusLabel(project.aiStatus)}
                />
              </SignalCard>
              {logsMetadata && (
                <SignalCard tone="success" title="OpenCode Logs">
                  <div className="text-xs">
                    <div>✓ Загружено: {logsMetadata.filesCount} файлов</div>
                    <div>
                      Размер:{" "}
                      {(logsMetadata.totalSize / 1024 / 1024).toFixed(2)}MB
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(logsMetadata.uploadedAt).toLocaleString(
                        "ru-RU",
                      )}
                    </div>
                    <div className="mt-2">
                      <Button
                        asChild
                        variant="outline"
                        size="xs"
                        className="bg-background/90"
                      >
                        <Link href={`/projects/${project.id}/logs`}>
                          Подробнее
                        </Link>
                      </Button>
                    </div>
                  </div>
                </SignalCard>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                Что это за проект
                <StatusPill
                  tone={getProjectRiskTone(project)}
                  label={getProjectProgressLabel(project)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                <div className="mb-1 text-sm font-medium text-foreground">
                  docs/README.md
                </div>
                <div className="app-scrollbar max-h-64 overflow-y-auto pr-2">
                  <MarkdownContent content={docsReadmePreview} />
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                <div className="mb-1 text-sm font-medium text-foreground">
                  Product context
                </div>
                <div className="app-scrollbar max-h-64 overflow-y-auto pr-2">
                  <MarkdownContent content={productContextPreview} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <HugeiconsIcon icon={Note01Icon} size={18} strokeWidth={1.8} />
                Текущий контекст
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                <div className="mb-1 text-sm font-medium text-foreground">
                  Progress
                </div>
                <div className="app-scrollbar max-h-64 overflow-y-auto pr-2">
                  <MarkdownContent content={progressContextPreview} />
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                <div className="mb-1 text-sm font-medium text-foreground">
                  Active context
                </div>
                <div className="app-scrollbar max-h-64 overflow-y-auto pr-2">
                  <MarkdownContent content={activeContextPreview} />
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                <div className="mb-1 text-sm font-medium text-foreground">
                  Следующие шаги
                </div>
                <div className="app-scrollbar max-h-64 space-y-2 overflow-y-auto pr-2">
                  {project.nextSteps.length > 0 ? (
                    project.nextSteps.map((step) => (
                      <MarkdownContent key={step} content={step} />
                    ))
                  ) : (
                    <span>
                      После AI-анализа здесь появятся следующие шаги по проекту.
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 w-full grid content-start gap-6 self-start">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Участники проекта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-muted-foreground">
                Репозиторий закреплен за{" "}
                <span className="font-medium text-foreground">
                  {project.ownerStudentName}
                </span>
                . Остальные подключаются как участники.
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/70 bg-background/70 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {member.studentName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.role === "owner"
                          ? "владелец репозитория"
                          : "участник"}
                      </div>
                    </div>
                    {member.role === "owner" ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <form
                          action={setProjectGroupModeAction}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="projectId"
                            value={project.id}
                          />
                          <input
                            type="hidden"
                            name="isGroupProject"
                            value={project.isGroupProject ? "false" : "true"}
                          />
                          <span className="text-xs font-medium text-muted-foreground mr-1 select-none">
                            Групповой проект
                          </span>
                          <button
                            type="submit"
                            role="switch"
                            aria-checked={project.isGroupProject}
                            aria-label="Переключить режим группового проекта"
                            className={`group/switch relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200 outline-none ${
                              project.isGroupProject
                                ? "bg-primary/25 border-primary/40"
                                : "bg-white/8 border-white/10"
                            }`}
                          >
                            {/* Thumb */}
                            <span
                              className={`pointer-events-none block size-4 rounded-full shadow-sm transition-all duration-200 ${
                                project.isGroupProject
                                  ? "translate-x-5 bg-primary"
                                  : "translate-x-1 bg-white/40"
                              }`}
                            />
                          </button>
                        </form>
                        <StatusPill tone="calm" label="Owner" />
                      </div>
                    ) : (
                      <form action={removeProjectMemberAction}>
                        <input
                          type="hidden"
                          name="projectId"
                          value={project.id}
                        />
                        <input
                          type="hidden"
                          name="studentId"
                          value={member.studentId}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          size="xs"
                          className="bg-background/90"
                        >
                          Удалить из проекта
                        </Button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
              {project.isGroupProject && availableStudents.length > 0 ? (
                <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                  <div className="mb-2 text-sm font-medium text-foreground">
                    Добавить участника
                  </div>
                  <div className="app-scrollbar max-h-96 space-y-1.5 overflow-y-auto pr-1">
                    {availableStudents.map((student) => (
                      <form
                        key={student.id}
                        action={addProjectMemberAction}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/70 px-3 py-2 transition-colors hover:bg-accent/40"
                      >
                        <input
                          type="hidden"
                          name="projectId"
                          value={project.id}
                        />
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {student.lastName} {student.firstName}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {student.githubUsername
                              ? `GitHub: ${student.githubUsername}`
                              : "GitHub не привязан"}
                          </div>
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          size="xs"
                          className="shrink-0 bg-background/90"
                        >
                          Добавить
                        </Button>
                      </form>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {latestReport && latestReport.opencodeCoachScore !== undefined && (
            <Card className="border-border/70 bg-card/88 shadow-none animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={AiBrain03Icon}
                    size={16}
                    strokeWidth={1.8}
                    className="text-cyan-400"
                  />
                  AI Engineering Coach (OpenCode)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-background/50 p-3 border border-border/40">
                  <span className="text-muted-foreground">
                    Индекс гигиены ИИ:
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {latestReport.opencodeCoachScore}/100
                  </span>
                </div>
                {latestReport.opencodeCoachReport && (
                  <div className="app-scrollbar max-h-96 overflow-y-auto pr-2 rounded-lg border border-border/70 bg-background/70 p-3">
                    <MarkdownContent
                      content={latestReport.opencodeCoachReport}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={AiBrain03Icon}
                  size={16}
                  strokeWidth={1.8}
                />
                AI summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="app-scrollbar max-h-64 overflow-y-auto pr-2">
                <MarkdownContent content={aiSummaryText} />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg border border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">
                <div className="col-span-2 text-sm font-medium text-foreground">
                  Signals
                </div>
                <div className="col-span-2">
                  Ученик:{" "}
                  <span className="text-foreground">{project.studentName}</span>
                  {" · "}
                  Репозиторий:{" "}
                  {project.hasRepository ? "подключен" : "не найден"}
                </div>
                <div>
                  GitHub:{" "}
                  <Link
                    href={project.githubUrl}
                    className="text-primary underline-offset-4 hover:underline"
                    target="_blank"
                  >
                    {project.githubOwner && project.githubRepo
                      ? `${project.githubOwner}/${project.githubRepo}`
                      : "ссылка"}
                  </Link>
                </div>
                <div>
                  memory_bank:{" "}
                  {getProjectBooleanMetricLabel(
                    project,
                    project.hasMemoryBank,
                    {
                      positive: "есть",
                      negative: "нет",
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Расчет progress</CardTitle>
            </CardHeader>
            <CardContent>
              <SignalCard
                tone={progressCalculationTone}
                title={
                  snapshot?.taskMetrics.progressCalculationStatus === "valid"
                    ? "Project Deliverables валиден"
                    : "Расчёт progress"
                }
              >
                <div className="leading-relaxed">
                  {progressCalculationDetails}
                </div>
                {snapshot ? (
                  <div>
                    Total Weight: {snapshot.taskMetrics.deliverablesWeightTotal}
                  </div>
                ) : null}
              </SignalCard>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={Github01Icon}
                  size={16}
                  strokeWidth={1.8}
                />
                История AI-отчетов
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {reports.length > 0 ? (
                <div className="app-scrollbar max-h-96 space-y-2 overflow-y-auto pr-1">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border border-border/70 bg-background/70 p-3"
                    >
                      <div className="font-medium">
                        {report.completionPercent}% •{" "}
                        {formatDateTimeShort(report.createdAt)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        memory_bank: {report.hasMemoryBank ? "да" : "нет"} • ТЗ:{" "}
                        {report.hasSpec ? "да" : "нет"} • План:{" "}
                        {report.hasPlan ? "да" : "нет"}
                      </div>
                      <div className="mt-1">
                        <MarkdownContent content={report.summary} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-muted-foreground">
                  История AI-отчетов пока пуста.
                </div>
              )}
              <form action={deleteProjectAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <Button
                  variant="outline"
                  size="xs"
                  className="bg-background/90 text-destructive border-destructive/25 hover:bg-destructive/10 hover:text-destructive"
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
