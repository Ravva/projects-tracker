import Link from "next/link";
import { notFound } from "next/navigation";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTeacherSession } from "@/lib/server/auth";
import { getUploadedLogsMetadata } from "@/lib/server/logs-storage";
import { getProject } from "@/lib/server/repositories/projects";

export default async function ProjectLogsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const teacher = await requireTeacherSession();
  const { projectId } = await params;

  const [project, logsMetadata] = await Promise.all([
    getProject(projectId),
    getUploadedLogsMetadata(projectId),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <TeacherShell
      eyebrow="OpenCode Logs"
      title={`Логи проекта: ${project.name}`}
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <Button
          asChild
          variant="outline"
          className="rounded-xl bg-background/90"
        >
          <Link href={`/projects/${projectId}`}>Назад к проекту</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {logsMetadata ? (
          <>
            <Card className="border-border/70 bg-card/88 shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Информация о загруженных логах
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Количество файлов
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {logsMetadata.filesCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Общий размер
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {(logsMetadata.totalSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Дата загрузки
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {new Date(logsMetadata.uploadedAt).toLocaleString(
                        "ru-RU",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Срок действия
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {new Date(logsMetadata.expiresAt).toLocaleString(
                        "ru-RU",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[hsl(var(--status-calm)/0.3)] bg-[hsl(var(--status-calm)/0.08)] p-4">
                  <div className="text-sm font-medium">ℹ️ О логах</div>
                  <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <p>
                      Логи OpenCode содержат информацию о сессиях работы ученика
                      с AI-ассистентом.
                    </p>
                    <p>
                      Все чувствительные данные (токены, пароли, email)
                      автоматически удаляются перед загрузкой на сервер.
                    </p>
                    <p>
                      Логи хранятся временно (1 час) и используются только для
                      анализа AI Engineering Coach.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/88 shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Что дальше?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="font-medium">
                    1. AI-анализ запущен автоматически
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    После загрузки логов система автоматически запустила
                    AI-анализ проекта. Результаты появятся на странице проекта
                    через несколько минут.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="font-medium">2. Просмотр результатов</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Вернитесь на страницу проекта, чтобы увидеть блок "🤖 AI
                    Engineering Coach (OpenCode)" с оценкой и рекомендациями.
                  </p>
                  <div className="mt-3">
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl bg-background/90"
                    >
                      <Link href={`/projects/${projectId}`}>
                        Перейти к проекту
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="font-medium">3. Повторная загрузка</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Логи действительны 1 час. Если ученик загрузит новые логи,
                    предыдущие будут заменены, и анализ запустится заново.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardContent className="py-12 text-center">
              <div className="text-4xl">📭</div>
              <div className="mt-4 text-lg font-medium">Логи не загружены</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Ученик еще не загрузил логи OpenCode для этого проекта.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Попросите ученика зайти на страницу "Ваши проекты" и загрузить
                логи через веб-интерфейс.
              </p>
              <div className="mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl bg-background/90"
                >
                  <Link href={`/projects/${projectId}`}>
                    Вернуться к проекту
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherShell>
  );
}
