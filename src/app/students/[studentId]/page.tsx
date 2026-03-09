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
import { Input } from "@/components/ui/input";
import { requireTeacherSession } from "@/lib/server/auth";
import { getStudent } from "@/lib/server/repositories/students";

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
            className="rounded-xl bg-background/90"
          >
            <Link href="/students">К списку</Link>
          </Button>
          <form action={deleteStudentAction}>
            <input type="hidden" name="studentId" value={student.id} />
            <Button variant="outline" className="rounded-xl bg-background/90">
              Удалить
            </Button>
          </form>
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Профиль ученика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={updateStudentAction} className="space-y-6">
              <input type="hidden" name="studentId" value={student.id} />

              <div className="flex items-center gap-4 rounded-3xl border border-border/70 bg-background/70 p-4">
                <Avatar size="lg">
                  <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-semibold">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {student.lastActivity}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    Имя
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={student.firstName}
                    className="rounded-xl bg-background/80"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Фамилия
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={student.lastName}
                    className="rounded-xl bg-background/80"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="githubUsername"
                    className="text-sm font-medium"
                  >
                    GitHub username
                  </label>
                  <Input
                    id="githubUsername"
                    name="githubUsername"
                    defaultValue={student.githubUsername}
                    className="rounded-xl bg-background/80"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="githubUserId" className="text-sm font-medium">
                    GitHub user id
                  </label>
                  <Input
                    id="githubUserId"
                    name="githubUserId"
                    defaultValue={student.githubUserId}
                    className="rounded-xl bg-background/80"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="telegramUsername"
                    className="text-sm font-medium"
                  >
                    Telegram username
                  </label>
                  <Input
                    id="telegramUsername"
                    name="telegramUsername"
                    defaultValue={student.telegramUsername}
                    className="rounded-xl bg-background/80"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="telegramChatId"
                    className="text-sm font-medium"
                  >
                    Telegram chat id
                  </label>
                  <Input
                    id="telegramChatId"
                    name="telegramChatId"
                    defaultValue={student.telegramChatId}
                    placeholder="Заполнить вручную"
                    className="rounded-xl bg-background/80"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="teacherNote" className="text-sm font-medium">
                  Заметка преподавателя
                </label>
                <textarea
                  id="teacherNote"
                  name="notes"
                  className="min-h-32 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none ring-0"
                  defaultValue={student.notes}
                />
              </div>

              <Button type="submit" className="rounded-xl">
                Сохранить изменения
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6">
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
                Посещаемость этой недели: {student.attendanceRate}%. Проектов в
                работе: {student.projectsCount}.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Контрольные сигналы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center gap-3 font-medium">
                  <HugeiconsIcon
                    icon={Notification01Icon}
                    size={18}
                    strokeWidth={1.8}
                  />
                  Telegram
                </div>
                <p className="mt-2 leading-6 text-muted-foreground">
                  {student.telegramChatId
                    ? "chat id уже есть, персональные уведомления доступны."
                    : "chat id отсутствует, пока доступен только общий канал уведомлений."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center gap-3 font-medium">
                  <HugeiconsIcon
                    icon={Github01Icon}
                    size={18}
                    strokeWidth={1.8}
                  />
                  GitHub identity
                </div>
                <p className="mt-2 leading-6 text-muted-foreground">
                  Связка уже хранится по `github_user_id`, это безопаснее для
                  будущего student-access.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center gap-3 font-medium">
                  <HugeiconsIcon
                    icon={Note01Icon}
                    size={18}
                    strokeWidth={1.8}
                  />
                  Последняя AI-сводка
                </div>
                <p className="mt-2 leading-6 text-muted-foreground">
                  {student.aiSummary}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </TeacherShell>
  );
}
