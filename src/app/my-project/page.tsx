import Link from "next/link";
import { redirect } from "next/navigation";
import { chooseStudentProjectAction } from "@/app/my-project/actions";
import { CopyProjectSetupPrompt } from "@/app/my-project/copy-project-setup-prompt";
import { CopyTextButton } from "@/app/my-project/copy-text-button";
import { RepoSubmitButton } from "@/app/my-project/repo-submit-button";
import { UploadLogsCard } from "@/app/my-project/upload-logs-card";
import { ScrollToElement } from "@/components/app/scroll-to-element";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectRiskLabel } from "@/lib/project-risk";
import { getProjectStatusLabel, isProjectCurrent } from "@/lib/project-status";
import {
  getCurrentAuthRole,
  getCurrentGithubAccessToken,
  requireAuthenticatedSession,
  requireStudentSession,
} from "@/lib/server/auth";
import { getCanonicalAgentsDocument } from "@/lib/server/canonical-agents";
import {
  type GithubRepositoryOption,
  listGithubRepositoriesForStudent,
} from "@/lib/server/github";
import { listProjectsByStudentId } from "@/lib/server/repositories/projects";
import type { ProjectRecord } from "@/lib/types";

function formatUpdatedAt(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Дата недоступна";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function normalizeRepositoryUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getProjectSelectionSummary(input: {
  currentProjectsCount: number;
  completedProjectsCount: number;
}) {
  if (input.currentProjectsCount > 0) {
    return {
      tone: "warning" as const,
      title: "Сейчас новый проект выбрать нельзя",
      description:
        "У вас уже есть текущий проект. Когда преподаватель переведет его в статус «завершен», здесь сразу откроется выбор следующего репозитория.",
    };
  }

  if (input.completedProjectsCount > 0) {
    return {
      tone: "success" as const,
      title: "Можно выбрать следующий проект",
      description:
        "Текущих проектов больше нет. Выберите новый репозиторий или повторно запустите репозиторий из истории, если хотите продолжить его новой итерацией.",
    };
  }

  return {
    tone: "calm" as const,
    title: "Можно выбрать первый проект",
    description:
      "Список репозиториев уже готов. Выберите тот, с которого хотите начать работу в Projects Tracker.",
  };
}

function getRepositorySelectionState(input: {
  privateRepository: boolean;
  alreadyCurrent: boolean;
  alreadyCompleted: boolean;
  canChooseNextProject: boolean;
  isTeacherPreview: boolean;
}) {
  if (input.privateRepository) {
    return {
      label: "Недоступен",
      tone: "critical" as const,
      actionLabel: "Приватный",
      reason:
        "Приватные репозитории нельзя выбрать в student-flow. Нужен публичный GitHub-репозиторий.",
      disabled: true,
    };
  }

  if (input.alreadyCurrent) {
    return {
      label: "Текущий проект",
      tone: "calm" as const,
      actionLabel: "Уже выбран",
      reason:
        "Этот репозиторий уже привязан к вашему текущему проекту. Ниже можно открыть его карточку и GitHub.",
      disabled: true,
    };
  }

  if (!input.canChooseNextProject) {
    return {
      label: "Ожидает завершения",
      tone: "warning" as const,
      actionLabel: "Завершите текущий",
      reason:
        "Сначала преподаватель должен завершить ваш текущий проект. После этого новый репозиторий станет доступен сразу на этой странице.",
      disabled: true,
    };
  }

  if (input.isTeacherPreview) {
    return {
      label: "Preview",
      tone: "calm" as const,
      actionLabel: "Недоступно",
      reason:
        "В teacher preview кнопка отключена, чтобы не запускать реальные student-действия.",
      disabled: true,
    };
  }

  if (input.alreadyCompleted) {
    return {
      label: "Можно запустить заново",
      tone: "success" as const,
      actionLabel: "Начать заново",
      reason:
        "Этот репозиторий уже был у вас в истории. Сейчас его можно снова выбрать и начать новую итерацию проекта.",
      disabled: false,
    };
  }

  return {
    label: "Готов к запуску",
    tone: "success" as const,
    actionLabel: "Начать проект",
    reason:
      "Репозиторий доступен для привязки. После выбора он появится в текущих проектах, а AI-анализ запустится автоматически.",
    disabled: false,
  };
}

const PREVIEW_PROJECTS: ProjectRecord[] = [
  {
    id: "preview-active-project",
    studentId: "preview-student",
    studentName: "Превью ученика",
    ownerStudentId: "preview-student",
    ownerStudentName: "Превью ученика",
    memberStudentIds: ["preview-student", "preview-second-student"],
    memberNames: ["Превью ученика", "Второй участник"],
    membersCount: 2,
    isGroupProject: true,
    name: "LinguaFlow",
    summary: "Учебный проект с AI-практикой и memory_bank.",
    status: "active",
    risk: "healthy",
    riskFlags: [],
    hasAiAnalysisSnapshot: true,
    progress: 72,
    aiCompletionPercent: 72,
    manualCompletionPercent: null,
    manualOverrideEnabled: false,
    manualOverrideNote: "",
    lastCommit: "2026-03-14T10:00:00.000Z",
    lastCommitSha: "previewsha1",
    lastSyncAt: "2026-03-14T10:00:00.000Z",
    lastAiAnalysisAt: "2026-03-14T10:15:00.000Z",
    githubUrl: "https://github.com/example/linguaflow",
    githubOwner: "example",
    githubRepo: "linguaflow",
    defaultBranch: "main",
    specMarkdown: "",
    planMarkdown: "",
    aiSummary: "Превью активного проекта с корректной структурой memory_bank.",
    nextSteps: ["Дописать deliverables", "Обновить progress.md"],
    syncStatus: "synced",
    syncStatusReason: "Локальный snapshot совпадает с GitHub default branch.",
    aiStatus: "up_to_date",
    remoteLastCommit: "2026-03-14T10:00:00.000Z",
    remoteLastCommitSha: "previewsha1",
    hasRepository: true,
    hasMemoryBank: true,
    hasSpec: true,
    hasPlan: true,
    trackedTasksTotal: 10,
    trackedTasksCompleted: 7,
    trackedTasksInProgress: 2,
    trackedTasksPending: 1,
    commitCount: 14,
    commitsPerWeek: 5,
    lastCommitDaysAgo: 0,
    isAbandoned: false,
  },
  {
    id: "preview-completed-project",
    studentId: "preview-student",
    studentName: "Превью ученика",
    ownerStudentId: "preview-student",
    ownerStudentName: "Превью ученика",
    memberStudentIds: ["preview-student"],
    memberNames: ["Превью ученика"],
    membersCount: 1,
    isGroupProject: false,
    name: "StartLaunch",
    summary: "Завершённый учебный проект.",
    status: "completed",
    risk: "healthy",
    riskFlags: [],
    hasAiAnalysisSnapshot: true,
    progress: 100,
    aiCompletionPercent: 100,
    manualCompletionPercent: null,
    manualOverrideEnabled: false,
    manualOverrideNote: "",
    lastCommit: "2026-02-28T10:00:00.000Z",
    lastCommitSha: "previewsha2",
    lastSyncAt: "2026-02-28T10:00:00.000Z",
    lastAiAnalysisAt: "2026-02-28T10:15:00.000Z",
    githubUrl: "https://github.com/example/startlaunch",
    githubOwner: "example",
    githubRepo: "startlaunch",
    defaultBranch: "main",
    specMarkdown: "",
    planMarkdown: "",
    aiSummary: "Превью завершённого проекта в истории ученика.",
    nextSteps: [],
    syncStatus: "synced",
    syncStatusReason: "Локальный snapshot совпадает с GitHub default branch.",
    aiStatus: "up_to_date",
    remoteLastCommit: "2026-02-28T10:00:00.000Z",
    remoteLastCommitSha: "previewsha2",
    hasRepository: true,
    hasMemoryBank: true,
    hasSpec: true,
    hasPlan: true,
    trackedTasksTotal: 8,
    trackedTasksCompleted: 8,
    trackedTasksInProgress: 0,
    trackedTasksPending: 0,
    commitCount: 19,
    commitsPerWeek: 2,
    lastCommitDaysAgo: 14,
    isAbandoned: false,
  },
];

const PREVIEW_REPOSITORIES: GithubRepositoryOption[] = [
  {
    id: 1,
    name: "next-step-project",
    fullName: "example/next-step-project",
    url: "https://github.com/example/next-step-project",
    description: "Следующий репозиторий для нового проекта.",
    updatedAt: "2026-03-13T09:00:00.000Z",
    defaultBranch: "main",
    private: false,
  },
  {
    id: 2,
    name: "experimental-app",
    fullName: "example/experimental-app",
    url: "https://github.com/example/experimental-app",
    description: "Репозиторий для второй идеи ученика.",
    updatedAt: "2026-03-12T15:30:00.000Z",
    defaultBranch: "main",
    private: false,
  },
];

export default async function MyProjectPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    projectName?: string;
    preview?: string;
    success?: string;
  }>;
}) {
  const role = await getCurrentAuthRole();
  const sessionUser = await requireAuthenticatedSession();
  const { error, notice, projectName, preview, success } = await searchParams;
  const isTeacherPreview = role === "teacher" && preview === "teacher";

  if (role === "teacher" && !isTeacherPreview) {
    redirect("/");
  }

  const student = isTeacherPreview
    ? {
        ...sessionUser,
        studentId: "preview-student",
        studentName: "Превью ученика",
      }
    : await requireStudentSession();
  let projects: ProjectRecord[] = [];
  let repositories: GithubRepositoryOption[] = PREVIEW_REPOSITORIES;
  let repositoryLoadError = "";
  const canonicalAgentsDocument = await getCanonicalAgentsDocument();

  if (isTeacherPreview) {
    projects = PREVIEW_PROJECTS;
  } else {
    projects = await listProjectsByStudentId(student.studentId);
    const githubAccessToken = await getCurrentGithubAccessToken();

    try {
      repositories = await listGithubRepositoriesForStudent({
        accessToken: githubAccessToken,
        githubLogin: student.githubLogin,
      });
    } catch (error) {
      repositoryLoadError =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "Не удалось получить список GitHub-репозиториев.";
      repositories = [];

      console.error("[my-project] Failed to load student repositories", {
        studentId: student.studentId,
        githubLogin: student.githubLogin,
        error,
      });
    }
  }
  const currentProjects = projects.filter((project) =>
    isProjectCurrent(project.status),
  );
  const completedProjects = projects.filter(
    (project) => !isProjectCurrent(project.status),
  );
  const currentProjectUrls = new Set(
    currentProjects.map((project) => normalizeRepositoryUrl(project.githubUrl)),
  );
  const completedProjectUrls = new Set(
    completedProjects.map((project) =>
      normalizeRepositoryUrl(project.githubUrl),
    ),
  );
  const canChooseNextProject = currentProjects.length === 0;
  const projectSelectionSummary = getProjectSelectionSummary({
    currentProjectsCount: currentProjects.length,
    completedProjectsCount: completedProjects.length,
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.09),transparent_32%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.09),transparent_25%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))] px-4 py-12 md:py-20">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass rounded-lg border border-border/80 bg-card/65 backdrop-blur-md p-8 shadow-sm transition-all duration-200">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isTeacherPreview ? "Teacher preview" : "Student access"}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Ваши проекты
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground font-medium">
            {student.studentName}, здесь хранится история ваших GitHub-проектов
            в Projects Tracker, включая групповые проекты. Новый репозиторий
            можно начать только после завершения текущего проекта
            преподавателем.
          </p>
          {isTeacherPreview ? (
            <div className="mt-4 rounded-lg border border-[hsl(var(--status-calm)/0.25)] bg-[hsl(var(--status-calm)/0.08)] px-4 py-3 text-xs leading-relaxed text-foreground font-semibold">
              Это предпросмотр студенческого экрана преподавателем на
              демо-данных. Реальные проверки авторизации и привязки не активны.
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs leading-relaxed text-destructive font-semibold">
              {error}
            </div>
          ) : null}
          {success === "project-created" ? (
            <>
              <ScrollToElement elementId="success-banner" />
              <div
                id="success-banner"
                className="mt-4 rounded-lg border border-[hsl(var(--status-calm)/0.25)] bg-[hsl(var(--status-calm)/0.08)] px-5 py-4 text-foreground shadow-sm"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--status-calm))]">
                  Проект создан
                </div>
                <div className="mt-1 text-base font-bold leading-tight">
                  {projectName
                    ? `Репозиторий ${projectName} успешно привязан.`
                    : "Репозиторий успешно привязан к новому проекту."}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  Новый проект уже появился в блоке текущих проектов в нижней
                  секции. Автоматический AI-анализ запущен сразу после привязки.
                </p>
              </div>
            </>
          ) : null}
          {success === "project-restarted" ? (
            <>
              <ScrollToElement elementId="success-banner" />
              <div
                id="success-banner"
                className="mt-4 rounded-lg border border-[hsl(var(--status-success)/0.25)] bg-[hsl(var(--status-success)/0.08)] px-5 py-4 text-foreground shadow-sm"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--status-success))]">
                  Проект запущен заново
                </div>
                <div className="mt-1 text-base font-bold leading-tight">
                  {projectName
                    ? `Репозиторий ${projectName} снова добавлен в текущие проекты.`
                    : "Репозиторий снова добавлен в текущие проекты."}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  Это новая итерация проекта из вашей истории. Автоматический
                  AI-анализ тоже запущен сразу после привязки.
                </p>
              </div>
            </>
          ) : null}
          {notice ? (
            <div className="mt-4 rounded-lg border border-[hsl(var(--status-warning)/0.25)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 text-xs leading-relaxed text-foreground font-semibold">
              {notice}
            </div>
          ) : null}
          <div className="mt-6 rounded-lg border border-border bg-background-secondary px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Состояние выбора проекта
                </div>
                <div className="text-base font-bold leading-tight text-foreground">
                  {projectSelectionSummary.title}
                </div>
                <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground font-medium mt-1">
                  {projectSelectionSummary.description}
                </p>
              </div>
              <StatusPill
                label={projectSelectionSummary.title}
                tone={projectSelectionSummary.tone}
              />
            </div>
          </div>
        </section>

        <Card className="glass overflow-hidden border-border/85 bg-card/65 backdrop-blur-md shadow-sm">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between p-6 focus:outline-none select-none">
              <div className="space-y-2 pr-4">
                <div className="inline-flex w-fit rounded-full border border-[hsl(var(--status-warning)/0.25)] bg-[hsl(var(--status-warning)/0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--status-warning))]">
                  Project readiness
                </div>
                <CardTitle className="text-lg leading-tight font-bold text-foreground">
                  Два шага — и репозиторий готов к AI-анализу
                </CardTitle>
                <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground font-medium mt-1">
                  Нажмите, чтобы развернуть инструкцию по добавлению{" "}
                  <code className="text-foreground font-semibold">
                    AGENTS.md
                  </code>{" "}
                  и первичному промпту.
                </p>
              </div>
              <div className="text-[hsl(var(--status-warning))] transition-transform duration-200 group-open:rotate-180 shrink-0">
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </summary>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground border-t border-border bg-background/25 p-6 font-medium">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm text-sm">
                  <div className="mb-3 inline-flex size-7 items-center justify-center rounded-full bg-[hsl(var(--status-warning)/0.14)] font-bold text-xs text-[hsl(var(--status-warning))]">
                    1
                  </div>
                  <div className="font-semibold text-foreground">
                    Скопируйте AGENTS.md
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                    Вставьте файл в корень вашего репозитория. Он содержит
                    правила, по которым ИИ оценивает прогресс проекта.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <CopyTextButton
                      text={canonicalAgentsDocument.content}
                      idleLabel="Скоропировать AGENTS.md"
                      successLabel="Копия готова"
                    />
                    <Button asChild variant="outline">
                      <Link
                        href={canonicalAgentsDocument.blobUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Открыть источник
                      </Link>
                    </Button>
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground font-medium">
                    Источник:{" "}
                    {canonicalAgentsDocument.source === "remote"
                      ? "актуальная версия из GitHub"
                      : "локальный fallback"}
                    .
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm text-sm font-medium">
                  <div className="mb-3 inline-flex size-7 items-center justify-center rounded-full bg-[hsl(var(--status-calm)/0.14)] font-bold text-xs text-[hsl(var(--status-calm))]">
                    2
                  </div>
                  <div className="font-semibold text-foreground">
                    Вставьте промпт в ИИ
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                    Скопируйте готовый промпт ниже и отправьте его в ChatGPT,
                    Cursor или любой другой ИИ-ассистент, работающий с вашим
                    репозиторием.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                    ИИ автоматически проверит структуру <code>memory_bank</code>
                    , создаст <code>projectbrief.md</code> с таблицей{" "}
                    <code>Project Deliverables</code> и сделает коммит.
                  </p>
                </div>
              </div>
              <CopyProjectSetupPrompt
                agentsSourceUrl={canonicalAgentsDocument.blobUrl}
              />
            </CardContent>
          </details>
        </Card>

        {currentProjects.length > 0 && !isTeacherPreview && (
          <UploadLogsCard projectId={currentProjects[0].id} />
        )}

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="glass border-border/80 bg-card/65 backdrop-blur-md shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground">
                Текущие и завершенные
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm font-medium">
              {currentProjects.length > 0 ? (
                currentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-lg border border-[hsl(var(--status-calm)/0.25)] bg-[hsl(var(--status-calm)/0.08)] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-foreground">
                        {project.name}
                      </div>
                      <div className="rounded-full border border-border bg-background px-3 py-0.5 text-xs text-muted-foreground font-semibold">
                        {getProjectStatusLabel(project.status)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Прогресс:{" "}
                      <span className="font-semibold text-foreground">
                        {project.progress}%
                      </span>{" "}
                      • Риск:{" "}
                      <span className="font-semibold text-foreground">
                        {getProjectRiskLabel(project.risk)}
                      </span>{" "}
                      • Участники:{" "}
                      <span className="font-semibold text-foreground">
                        {project.memberNames.join(", ")}
                      </span>
                      .
                    </div>
                    <div className="mt-4">
                      <Button asChild variant="outline">
                        <Link
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Открыть репозиторий
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-background/50 p-5 text-xs text-muted-foreground font-medium leading-relaxed">
                  Сейчас у вас нет текущего проекта. Можно выбрать новый
                  репозиторий из списка GitHub справа.
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-border mt-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  История завершённых проектов
                </div>
                {completedProjects.length > 0 ? (
                  completedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-border bg-background-secondary p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold text-foreground">
                          {project.name}
                        </div>
                        <div className="rounded-full border border-border bg-background px-3 py-0.5 text-xs text-muted-foreground font-semibold">
                          {getProjectStatusLabel(project.status)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        Итоговый прогресс:{" "}
                        <span className="font-semibold text-foreground">
                          {project.progress}%
                        </span>{" "}
                        • Последнее обновление:{" "}
                        <span className="font-semibold text-foreground">
                          {formatUpdatedAt(project.lastCommit)}
                        </span>{" "}
                        • Участники:{" "}
                        <span className="font-semibold text-foreground">
                          {project.memberNames.join(", ")}
                        </span>
                        .
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-background/50 p-5 text-xs text-muted-foreground font-medium leading-relaxed">
                    Завершённых проектов пока нет.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/80 bg-card/65 backdrop-blur-md shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground">
                Репозитории для следующего проекта
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-medium">
              {!canChooseNextProject ? (
                <div className="rounded-lg border border-[hsl(var(--status-warning)/0.25)] bg-[hsl(var(--status-warning)/0.08)] p-4 text-xs leading-relaxed text-muted-foreground font-medium">
                  Новый проект пока недоступен: сначала преподаватель должен
                  перевести текущий проект в статус «завершен». Как только это
                  произойдет, список ниже сразу станет активным.
                </div>
              ) : null}
              {repositoryLoadError ? (
                <div className="rounded-lg border border-dashed border-border bg-background/50 p-5 text-xs leading-relaxed text-muted-foreground font-medium">
                  {repositoryLoadError} Проверьте, что вход выполнен через
                  корректный GitHub-аккаунт и у приложения есть доступ к
                  репозиториям владельца.
                </div>
              ) : repositories.length > 0 ? (
                repositories.map((repository) => {
                  const normalizedRepositoryUrl = normalizeRepositoryUrl(
                    repository.url,
                  );
                  const alreadyCurrent = currentProjectUrls.has(
                    normalizedRepositoryUrl,
                  );
                  const alreadyCompleted = completedProjectUrls.has(
                    normalizedRepositoryUrl,
                  );
                  const repositoryState = getRepositorySelectionState({
                    privateRepository: repository.private,
                    alreadyCurrent,
                    alreadyCompleted,
                    canChooseNextProject,
                    isTeacherPreview,
                  });

                  return (
                    <div
                      key={repository.id}
                      className={
                        repository.private
                          ? "rounded-lg border border-[hsl(var(--status-critical)/0.25)] bg-[hsl(var(--status-critical)/0.08)] p-5"
                          : "rounded-lg border border-border bg-card p-5 shadow-sm hover:border-border/100 transition-all duration-200"
                      }
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-sm text-foreground">
                              {repository.fullName}
                            </div>
                            <StatusPill
                              label={repositoryState.label}
                              tone={repositoryState.tone}
                            />
                            {repository.private ? (
                              <span className="rounded-full border border-[hsl(var(--status-critical)/0.25)] bg-[hsl(var(--status-critical)/0.14)] px-2.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--status-critical))] uppercase tracking-wider">
                                Приватный
                              </span>
                            ) : null}
                          </div>
                          <div className="text-muted-foreground font-medium text-xs leading-relaxed">
                            {repository.description ||
                              "Описание пока отсутствует."}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-semibold leading-normal">
                            Обновлён: {formatUpdatedAt(repository.updatedAt)} •
                            Ветка по умолчанию: {repository.defaultBranch}.
                          </div>
                          <div className="rounded-[8px] border border-border bg-background-secondary px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground font-medium">
                            {repositoryState.reason}
                          </div>
                        </div>

                        <form
                          action={chooseStudentProjectAction}
                          className="shrink-0"
                        >
                          <input
                            type="hidden"
                            name="repositoryName"
                            value={repository.name}
                          />
                          <input
                            type="hidden"
                            name="repositoryUrl"
                            value={repository.url}
                          />
                          <input
                            type="hidden"
                            name="repositoryDescription"
                            value={repository.description}
                          />
                          <RepoSubmitButton
                            label={repositoryState.actionLabel}
                            disabled={repositoryState.disabled}
                          />
                        </form>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-background/50 p-5 text-xs leading-relaxed text-muted-foreground font-medium">
                  Не удалось получить список репозиториев GitHub. Проверьте, что
                  вход выполнен через корректный GitHub-аккаунт и у приложения
                  есть доступ к репозиториям владельца.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
