import Link from "next/link";

import { chooseStudentProjectAction } from "@/app/my-project/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectRiskLabel } from "@/lib/project-risk";
import { getProjectStatusLabel, isProjectCurrent } from "@/lib/project-status";
import { requireStudentSession } from "@/lib/server/auth";
import { listGithubRepositoriesForStudent } from "@/lib/server/github";
import { listProjectsByStudentId } from "@/lib/server/repositories/projects";

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

export default async function MyProjectPage() {
  const student = await requireStudentSession();
  const [projects, repositories] = await Promise.all([
    listProjectsByStudentId(student.studentId),
    listGithubRepositoriesForStudent(student.githubAccessToken),
  ]);
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
            Student access
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Ваши проекты
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            {student.studentName}, здесь хранится история ваших GitHub-проектов
            в Projects Tracker. Новый репозиторий можно начать только после
            завершения текущего проекта преподавателем.
          </p>
        </section>

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
              {repositories.length > 0 ? (
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
                            disabled={disabled}
                          >
                            {alreadySelected
                              ? "Уже в истории"
                              : !canChooseNextProject
                                ? "Сначала завершите текущий"
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
