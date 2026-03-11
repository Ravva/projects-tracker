import Link from "next/link";

import { chooseStudentProjectAction } from "@/app/my-project/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))] px-5 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/88 p-8 shadow-none">
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Student access
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Выбор проекта
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            {student.studentName}, здесь можно выбрать только свой
            GitHub-репозиторий и превратить его в проект внутри Projects
            Tracker. teacher-only редактирование посещаемости и административных
            данных остаётся у преподавателя.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Уже выбранные проекты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4"
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="mt-1 text-muted-foreground">
                      Статус: {project.status}. Прогресс: {project.progress}%.
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
                  Пока ни один репозиторий не выбран. Выберите проект из списка
                  GitHub справа.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Ваши GitHub-репозитории
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {repositories.length > 0 ? (
                repositories.map((repository) => {
                  const alreadySelected = selectedUrls.has(repository.url);

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
                            disabled={alreadySelected}
                          >
                            {alreadySelected ? "Уже выбран" : "Выбрать проект"}
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
