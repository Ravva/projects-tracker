import {
  Github01Icon,
  Note01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteStudentAction,
  updateStudentAction,
} from "@/app/students/actions";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputWithCounter,
  TextareaWithCounter,
} from "@/components/ui/field-with-counter";
import { Input } from "@/components/ui/input";
import { requireTeacherSession } from "@/lib/server/auth";
import { listProjectsByStudentId } from "@/lib/server/repositories/projects";
import { getStudent } from "@/lib/server/repositories/students";
import { getStudentTelegramInviteLink } from "@/lib/server/telegram-linking";
import { GithubLinkCard } from "./github-link-card";
import { NotificationCard } from "./notification-card";
import { TelegramLinkCard } from "./telegram-link-card";

export default async function StudentDetailsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const teacher = await requireTeacherSession();
  const { studentId } = await params;
  const student = await getStudent(studentId);

  if (!student) {
    notFound();
  }

  const telegramInviteLink =
    student.telegramLinkStatus === "awaiting_start"
      ? await getStudentTelegramInviteLink(student.id)
      : null;
  const studentProjects = await listProjectsByStudentId(student.id);

  return (
    <TeacherShell
      eyebrow="Teacher-only edit page"
      title={`${student.firstName} ${student.lastName}`}
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
            <Link href="/students">К списку</Link>
          </Button>
          <form action={deleteStudentAction}>
            <input type="hidden" name="studentId" value={student.id} />
            <Button variant="outline" size="sm" className="bg-background/90">
              Удалить
            </Button>
          </form>
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] w-full min-w-0">
        <div className="min-w-0 w-full">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Профиль ученика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form action={updateStudentAction} className="space-y-6">
                <input type="hidden" name="studentId" value={student.id} />

                <div className="flex items-center gap-4 rounded-lg border border-border/80 bg-background/70 p-4 font-sans">
                  <Avatar size="lg">
                    <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground font-sans">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-lg font-semibold text-foreground font-sans">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground font-sans">
                      {student.lastActivity}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 font-sans">
                  <div className="space-y-2">
                    <label
                      htmlFor="firstName"
                      className="text-sm font-medium text-foreground"
                    >
                      Имя
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={student.firstName}
                      className="rounded-md bg-background/80 font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="lastName"
                      className="text-sm font-medium text-foreground"
                    >
                      Фамилия
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={student.lastName}
                      className="rounded-md bg-background/80 font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="githubUsername"
                      className="text-sm font-medium text-foreground"
                    >
                      GitHub username
                    </label>
                    <Input
                      id="githubUsername"
                      name="githubUsername"
                      defaultValue={student.githubUsername}
                      className="rounded-md bg-background/80 font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="githubUserId"
                      className="text-sm font-medium text-foreground"
                    >
                      GitHub user id
                    </label>
                    <Input
                      id="githubUserId"
                      name="githubUserId"
                      defaultValue={student.githubUserId}
                      className="rounded-md bg-background/80 font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="telegramUsername"
                      className="text-sm font-medium text-foreground"
                    >
                      Telegram username
                    </label>
                    <Input
                      id="telegramUsername"
                      name="telegramUsername"
                      defaultValue={student.telegramUsername}
                      className="rounded-md bg-background/80 font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="telegramChatId"
                      className="text-sm font-medium text-foreground"
                    >
                      Telegram chat id
                    </label>
                    <InputWithCounter
                      id="telegramChatId"
                      name="telegramChatId"
                      defaultValue={student.telegramChatId}
                      placeholder="Например: 123456789 или -1001234567890"
                      className="rounded-md bg-background/80 font-sans"
                      maxLength={32}
                      inputMode="numeric"
                    />
                    <p className="text-xs leading-5 text-muted-foreground font-sans">
                      Храним только числовой chat id. Для групп и каналов он
                      часто начинается с `-100`.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 font-sans">
                  <label
                    htmlFor="notes"
                    className="text-sm font-medium text-foreground"
                  >
                    Заметка преподавателя
                  </label>
                  <TextareaWithCounter
                    id="notes"
                    name="notes"
                    className="min-h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground backdrop-blur-sm placeholder:text-muted-foreground/60 transition-all duration-200 outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_rgba(127,86,217,0.12)] font-sans resize-y"
                    defaultValue={student.notes}
                    maxLength={2000}
                  />
                </div>

                <Button type="submit" size="sm">
                  Сохранить изменения
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 w-full">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <TelegramLinkCard
              studentId={student.id}
              status={student.telegramLinkStatus}
              inviteLink={telegramInviteLink}
              telegramChatId={student.telegramChatId}
              linkedAt={student.telegramLinkedAt}
            />

            <GithubLinkCard
              studentId={student.id}
              githubUsername={student.githubUsername}
              githubUserId={student.githubUserId}
              telegramChatId={student.telegramChatId}
            />

            <NotificationCard
              studentId={student.id}
              telegramChatId={student.telegramChatId}
            />

            <Card className="border-border/70 bg-card/88 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Статус недели</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusPill
                  tone={student.weeklyState}
                  label={
                    student.weeklyState === "critical"
                      ? "критический"
                      : student.weeklyState === "warning"
                        ? "низкий"
                        : "стабильный"
                  }
                />
                <div className="text-sm leading-6 text-muted-foreground">
                  Посещаемость этой недели: {student.attendanceRate}%. Активных
                  проектов: {student.activeProjectsCount}, завершённых:{" "}
                  {student.completedProjectsCount}.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/88 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Контрольные сигналы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border border-border/80 bg-background/40 p-4 font-sans">
                  <div className="flex items-center gap-3 font-medium text-foreground">
                    <HugeiconsIcon
                      icon={Notification01Icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                    Telegram
                  </div>
                  <p className="mt-2 leading-6 text-muted-foreground font-sans">
                    {student.telegramChatId
                      ? "chat id уже есть, персональные уведомления доступны."
                      : "chat id отсутствует, пока доступен только общий канал уведомлений."}
                  </p>
                </div>
                <div className="rounded-lg border border-border/80 bg-background/40 p-4 font-sans">
                  <div className="flex items-center gap-3 font-medium text-foreground">
                    <HugeiconsIcon
                      icon={Github01Icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                    GitHub identity
                  </div>
                  <p className="mt-2 leading-6 text-muted-foreground font-sans">
                    Связка уже хранится по `github_user_id`, это безопаснее для
                    будущего student-access.
                  </p>
                </div>
                <div className="rounded-lg border border-border/80 bg-background/40 p-4 font-sans">
                  <div className="flex items-center gap-3 font-medium text-foreground">
                    <HugeiconsIcon
                      icon={Note01Icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                    Последняя AI-сводка
                  </div>
                  <div className="mt-2 max-h-48 overflow-y-auto pr-1 text-xs leading-5 text-muted-foreground scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent font-sans">
                    {student.aiSummary}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/88 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Проекты ученика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {studentProjects.length > 0 ? (
                  studentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-border/80 bg-background/40 p-4 font-sans"
                    >
                      <div className="font-medium text-foreground">
                        {project.name}
                      </div>
                      <div className="mt-1 text-muted-foreground font-sans">
                        Статус:{" "}
                        {project.status === "completed"
                          ? "завершен"
                          : "в работе"}
                        . Участники: {project.memberNames.join(", ")}.
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border/80 bg-background/50 p-4 text-muted-foreground font-sans">
                    Проекты для этого ученика пока не подключены.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </TeacherShell>
  );
}
