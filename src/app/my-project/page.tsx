import Link from "next/link";
import { redirect } from "next/navigation";

import { chooseStudentProjectAction } from "@/app/my-project/actions";
import { CopyProjectSetupPrompt } from "@/app/my-project/copy-project-setup-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectRiskLabel } from "@/lib/project-risk";
import { getProjectStatusLabel, isProjectCurrent } from "@/lib/project-status";
import {
  getCurrentAuthRole,
  requireAuthenticatedSession,
  requireStudentSession,
} from "@/lib/server/auth";
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

const PREVIEW_PROJECTS: ProjectRecord[] = [
  {
    id: "preview-active-project",
    studentId: "preview-student",
    studentName: "Превью ученика",
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
  searchParams: Promise<{ error?: string; preview?: string; success?: string }>;
}) {
  const role = await getCurrentAuthRole();
  const sessionUser = await requireAuthenticatedSession();
  const { error, preview, success } = await searchParams;
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

  if (isTeacherPreview) {
    projects = PREVIEW_PROJECTS;
  } else {
    projects = await listProjectsByStudentId(student.studentId);

    try {
      repositories = await listGithubRepositoriesForStudent(
        student.githubAccessToken,
      );
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
  const selectedUrls = new Set(projects.map((project) => project.githubUrl));
  const currentProjects = projects.filter((project) =>
    isProjectCurrent(project.status),
  );
  const completedProjects = projects.filter(
    (project) => !isProjectCurrent(project.status),
  );
  const canChooseNextProject = currentProjects.length === 0;

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
            в Projects Tracker. Новый репозиторий можно начать только после
            завершения текущего проекта преподавателем.
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
            <div className="mt-4 rounded-2xl border border-[hsl(var(--status-calm)/0.3)] bg-[hsl(var(--status-calm)/0.08)] px-4 py-3 text-sm text-foreground">
              Репозиторий успешно привязан к новому проекту.
            </div>
          ) : null}
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
                    Подготовьте репозиторий, чтобы AI-анализ был точным
                  </CardTitle>
                  <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                    Projects Tracker оценивает проект по структуре{" "}
                    <code>memory_bank</code> и правилам из{" "}
                    <code>AGENTS.md</code>. Если репозиторий не подготовлен,
                    процент выполнения и проектные сигналы будут искажены.
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
                  Добавьте AGENTS.md
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Создайте в корне проекта файл <code>AGENTS.md</code> и
                  вставьте в него актуальную базовую инструкцию для ИИ.
                </p>
                <Link
                  href="https://digital-ai-news.vercel.app/posts/176383d1-3711-4b37-be5e-9ea0a985d381"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Открыть базовую инструкцию
                </Link>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/72 p-4">
                <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-[hsl(var(--status-calm)/0.14)] font-semibold text-[hsl(var(--status-calm))]">
                  2
                </div>
                <div className="font-medium text-foreground">
                  Запустите готовый промпт
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  После добавления <code>AGENTS.md</code> отправьте ИИ готовый
                  промпт. Он сам проверит структуру <code>Memory Bank</code>,
                  обновит её при необходимости и выполнит commit/push.
                </p>
                <Link
                  href="https://digital-ai-news.vercel.app/posts/fb6be397-2bde-4c72-8baa-b82ecbe475d5"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Посмотреть, как устроен Memory Bank
                </Link>
              </div>
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Готовый промпт
            </div>
            <CopyProjectSetupPrompt />
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
                      {getProjectRiskLabel(project.risk)}.
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
                        коммит: {project.lastCommit}.
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
                  перевести текущий проект в статус «завершен».
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
                  const alreadySelected = selectedUrls.has(repository.url);
                  const disabled = alreadySelected || !canChooseNextProject;

                  return (
                    <div
                      key={repository.id}
                      className="rounded-2xl border border-border/70 bg-background/70 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {repository.fullName}
                          </div>
                          <div className="text-muted-foreground">
                            {repository.description ||
                              "Описание пока отсутствует."}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Обновлён: {formatUpdatedAt(repository.updatedAt)}.
                            Ветка по умолчанию: {repository.defaultBranch}.
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
                            disabled={disabled || isTeacherPreview}
                          >
                            {alreadySelected
                              ? "Уже в истории"
                              : !canChooseNextProject
                                ? "Сначала завершите текущий"
                                : isTeacherPreview
                                  ? "Недоступно в preview"
                                  : "Начать следующий проект"}
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
