import Link from "next/link";
import { redirect } from "next/navigation";
import { chooseStudentProjectAction } from "@/app/my-project/actions";
import { CopyProjectSetupPrompt } from "@/app/my-project/copy-project-setup-prompt";
import { CopyTextButton } from "@/app/my-project/copy-text-button";
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
    return "дата недоступна";
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
        "Текущих проектов больше нет. Выберите новый репозиторий справа или повторно запустите репозиторий из истории, если хотите продолжить его новой итерацией.",
    };
  }

  return {
    tone: "calm" as const,
    title: "Можно выбрать первый проект",
    description:
      "Список репозиториев справа уже готов. Выберите тот, с которого хотите начать работу в Projects Tracker.",
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
      actionLabel: "Сначала завершите текущий",
      reason:
        "Сначала преподаватель должен завершить ваш текущий проект. После этого новый репозиторий станет доступен сразу на этой странице.",
      disabled: true,
    };
  }

  if (input.isTeacherPreview) {
    return {
      label: "Preview",
      tone: "calm" as const,
      actionLabel: "Недоступно в preview",
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))] px-5 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/88 p-8 shadow-none">
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {isTeacherPreview ? "Teacher preview" : "Student access"}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Ваши проекты
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            {student.studentName}, здесь хранится история ваших GitHub-проектов
            в Projects Tracker, включая групповые проекты. Новый репозиторий
            можно начать только после завершения текущего проекта
            преподавателем.
          </p>
          {isTeacherPreview ? (
            <div className="mt-4 rounded-2xl border border-[hsl(var(--status-calm)/0.3)] bg-[hsl(var(--status-calm)/0.08)] px-4 py-3 text-sm text-foreground">
              Это teacher-only предпросмотр student-экрана на демо-данных.
              Реальные student-проверки авторизации и привязки не изменены.
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {success === "project-created" ? (
            <div className="mt-4 rounded-[1.75rem] border border-[hsl(var(--status-calm)/0.34)] bg-[linear-gradient(135deg,hsl(var(--status-calm)/0.2),hsl(var(--status-calm)/0.08)_58%,hsl(var(--background)))] px-5 py-4 text-foreground shadow-none">
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--status-calm))]">
                Проект создан
              </div>
              <div className="mt-2 text-lg font-semibold leading-tight">
                {projectName
                  ? `Репозиторий ${projectName} успешно привязан.`
                  : "Репозиторий успешно привязан к новому проекту."}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Новый проект уже появился в блоке текущих проектов ниже.
                Автоматический AI-анализ запущен сразу после привязки.
              </p>
            </div>
          ) : null}
          {success === "project-restarted" ? (
            <div className="mt-4 rounded-[1.75rem] border border-[hsl(var(--status-success)/0.32)] bg-[linear-gradient(135deg,hsl(var(--status-success)/0.2),hsl(var(--status-calm)/0.08)_58%,hsl(var(--background)))] px-5 py-4 text-foreground shadow-none">
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--status-success))]">
                Проект запущен заново
              </div>
              <div className="mt-2 text-lg font-semibold leading-tight">
                {projectName
                  ? `Репозиторий ${projectName} снова добавлен в текущие проекты.`
                  : "Репозиторий снова добавлен в текущие проекты."}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Это новая итерация проекта из вашей истории. Автоматический
                AI-анализ тоже запущен сразу после привязки.
              </p>
            </div>
          ) : null}
          {notice ? (
            <div className="mt-4 rounded-2xl border border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 text-sm text-foreground">
              {notice}
            </div>
          ) : null}
          <div className="mt-5 rounded-[1.75rem] border border-border/70 bg-background/60 px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Состояние выбора проекта
                </div>
                <div className="text-lg font-semibold leading-tight text-foreground">
                  {projectSelectionSummary.title}
                </div>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
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

        <Card className="overflow-hidden border-[hsl(var(--status-warning)/0.28)] bg-[linear-gradient(135deg,hsl(var(--status-warning)/0.16),hsl(var(--status-calm)/0.1)_52%,hsl(var(--background)))] shadow-none">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex w-fit rounded-full border border-[hsl(var(--status-warning)/0.28)] bg-background/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--status-warning))]">
                  Project readiness
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl leading-tight">
                    Два шага — и репозиторий готов к AI-анализу
                  </CardTitle>
                  <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                    Добавьте <code>AGENTS.md</code> и запустите готовый промпт в
                    ИИ. Он проверит <code>memory_bank</code>, исправит{" "}
                    <code>Project Deliverables</code> и подготовит репозиторий
                    автоматически.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/72 p-4">
                <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-[hsl(var(--status-warning)/0.14)] font-semibold text-[hsl(var(--status-warning))]">
                  1
                </div>
                <div className="font-medium text-foreground">
                  Скопируйте AGENTS.md
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Вставьте файл в корень вашего репозитория. Он содержит
                  правила, по которым ИИ оценивает прогресс проекта.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <CopyTextButton
                    text={canonicalAgentsDocument.content}
                    idleLabel="Скопировать AGENTS.md"
                    successLabel="AGENTS.md скопирован"
                  />
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl bg-background/90"
                  >
                    <Link
                      href={canonicalAgentsDocument.blobUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Открыть источник
                    </Link>
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  Источник:{" "}
                  {canonicalAgentsDocument.source === "remote"
                    ? "актуальная версия из GitHub"
                    : "локальный fallback, если GitHub временно недоступен"}
                  .
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/72 p-4">
                <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-[hsl(var(--status-calm)/0.14)] font-semibold text-[hsl(var(--status-calm))]">
                  2
                </div>
                <div className="font-medium text-foreground">
                  Вставьте промпт в ИИ
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Скопируйте готовый промпт ниже и отправьте его в ChatGPT,
                  Cursor или любой другой ИИ-ассистент, работающий с вашим
                  репозиторием.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  ИИ автоматически проверит структуру <code>memory_bank</code>,
                  создаст <code>projectbrief.md</code> с таблицей{" "}
                  <code>Project Deliverables</code> и сделает коммит.
                </p>
              </div>
            </div>
            <CopyProjectSetupPrompt
              agentsSourceUrl={canonicalAgentsDocument.blobUrl}
            />
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Текущие и завершенные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {currentProjects.length > 0 ? (
                currentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-[hsl(var(--status-calm)/0.3)] bg-[hsl(var(--status-calm)/0.08)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">{project.name}</div>
                      <div className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                        {getProjectStatusLabel(project.status)}
                      </div>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      Прогресс: {project.progress}%. Риск:{" "}
                      {getProjectRiskLabel(project.risk)}. Участники:{" "}
                      {project.memberNames.join(", ")}.
                    </div>
                    <div className="mt-3">
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl bg-background/90"
                      >
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
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-5 text-muted-foreground">
                  Сейчас у вас нет текущего проекта. Можно выбрать новый
                  репозиторий из списка GitHub справа.
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  История завершённых проектов
                </div>
                {completedProjects.length > 0 ? (
                  completedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-2xl border border-border/70 bg-background/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium">{project.name}</div>
                        <div className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                          {getProjectStatusLabel(project.status)}
                        </div>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Итоговый прогресс: {project.progress}%. Последний
                        коммит: {project.lastCommit}. Участники:{" "}
                        {project.memberNames.join(", ")}.
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-5 text-muted-foreground">
                    Завершённых проектов пока нет.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Репозитории для следующего проекта
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {!canChooseNextProject ? (
                <div className="rounded-2xl border border-[hsl(var(--status-warning)/0.3)] bg-[hsl(var(--status-warning)/0.08)] p-4 text-muted-foreground">
                  Новый проект пока недоступен: сначала преподаватель должен
                  перевести текущий проект в статус «завершен». Как только это
                  произойдет, список ниже сразу станет активным.
                </div>
              ) : null}
              {repositoryLoadError ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-5 text-muted-foreground">
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
                          ? "rounded-2xl border border-[hsl(var(--status-critical)/0.28)] bg-[hsl(var(--status-critical)/0.08)] p-4"
                          : "rounded-2xl border border-border/70 bg-background/70 p-4"
                      }
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">
                              {repository.fullName}
                            </div>
                            <StatusPill
                              label={repositoryState.label}
                              tone={repositoryState.tone}
                            />
                            {repository.private ? (
                              <span className="rounded-full border border-[hsl(var(--status-critical)/0.28)] bg-[hsl(var(--status-critical)/0.14)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--status-critical))]">
                                Приватный
                              </span>
                            ) : null}
                          </div>
                          <div className="text-muted-foreground">
                            {repository.description ||
                              "Описание пока отсутствует."}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Обновлён: {formatUpdatedAt(repository.updatedAt)}.
                            Ветка по умолчанию: {repository.defaultBranch}.
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-xs leading-6 text-muted-foreground">
                            {repositoryState.reason}
                          </div>
                        </div>

                        <form action={chooseStudentProjectAction}>
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
                          <Button
                            type="submit"
                            className="rounded-xl"
                            disabled={repositoryState.disabled}
                          >
                            {repositoryState.actionLabel}
                          </Button>
                        </form>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-5 text-muted-foreground">
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
