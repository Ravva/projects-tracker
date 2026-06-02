import {
  EditUser02Icon,
  Notification01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { createStudentAction } from "@/app/students/actions";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireTeacherSession } from "@/lib/server/auth";
import { listStudents } from "@/lib/server/repositories/students";
import { BulkNotificationCard } from "./bulk-notification-card";
import { ImportStudentsButton } from "./import-button";

export default async function StudentsPage() {
  const teacher = await requireTeacherSession();
  const students = await listStudents();
  const studentsWithoutChatId = students.filter(
    (student) => !student.telegramChatId,
  ).length;

  return (
    <TeacherShell
      eyebrow="Только для преподавателя"
      title="Ученики"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <>
          <ImportStudentsButton />
          <Button asChild className="rounded-md">
            <Link href="#create-student">Добавить ученика</Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Список учеников</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">№</TableHead>
                  <TableHead>Ученик</TableHead>
                  <TableHead>GitHub</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>Chat ID</TableHead>
                  <TableHead>Проекты</TableHead>
                  <TableHead>Посещаемость</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Appwrite не настроен или коллекция `students` пока пуста.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
                              {student.lastName[0]}
                              {student.firstName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {student.lastName} {student.firstName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {student.githubUsername ? (
                            <Link
                              href={`https://github.com/${student.githubUsername}`}
                              target="_blank"
                              className="text-primary hover:underline"
                            >
                              {student.githubUsername}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {student.telegramUsername || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {student.telegramChatId || "Не заполнен"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.activeProjectsCount}/{student.projectsCount}
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex">
                          <StatusPill
                            tone={
                              student.attendanceRate >= 100
                                ? "success"
                                : student.attendanceRate > 0
                                  ? "warning"
                                  : "critical"
                            }
                            label={`${student.attendanceRate}%`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-md"
                        >
                          <Link href={`/students/${student.id}`}>
                            <HugeiconsIcon
                              icon={EditUser02Icon}
                              size={16}
                              strokeWidth={1.8}
                            />
                            Редактировать
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Сводка модуля</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <BulkNotificationCard
              students={students.map((student) => ({
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                telegramChatId: student.telegramChatId,
                telegramUsername: student.telegramUsername,
              }))}
            />

            <form
              id="create-student"
              action={createStudentAction}
              className="space-y-3 rounded-lg border border-border/80 bg-card/65 p-4 font-sans"
            >
              <div className="font-medium text-foreground">Новый ученик</div>
              <Input
                name="firstName"
                placeholder="Имя"
                className="rounded-md bg-background/80 font-sans"
              />
              <Input
                name="lastName"
                placeholder="Фамилия"
                className="rounded-md bg-background/80 font-sans"
              />
              <Input
                name="githubUsername"
                placeholder="GitHub username"
                className="rounded-md bg-background/80 font-sans"
              />
              <Input
                name="githubUserId"
                placeholder="GitHub user id"
                className="rounded-md bg-background/80 font-sans"
              />
              <Input
                name="telegramUsername"
                placeholder="Telegram username"
                className="rounded-md bg-background/80 font-sans"
              />
              <Input
                name="telegramChatId"
                placeholder="Telegram chat id"
                className="rounded-md bg-background/80 font-sans"
              />
              <textarea
                name="notes"
                className="min-h-24 w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/50 resize-none font-sans"
                placeholder="Заметка преподавателя"
              />
              <Button type="submit" className="w-full rounded-md font-sans">
                Сохранить карточку
              </Button>
            </form>

            <div className="rounded-lg border border-border/80 bg-background/40 p-4 font-sans">
              <div className="flex items-center gap-3 font-medium text-foreground">
                <HugeiconsIcon icon={User02Icon} size={18} strokeWidth={1.8} />
                Активные карточки
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                {students.length > 0
                  ? `${students.length} учеников уже заведены в систему и доступны только преподавателю.`
                  : "После настройки Appwrite здесь появятся реальные карточки учеников."}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/40 p-4 font-sans">
              <div className="flex items-center gap-3 font-medium text-foreground">
                <HugeiconsIcon
                  icon={Notification01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
                Готовность к уведомлениям
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                {studentsWithoutChatId > 0
                  ? `${studentsWithoutChatId} учеников пока без chat id, персональные уведомления не готовы.`
                  : "Все карточки с chat id готовы к персональным уведомлениям."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </TeacherShell>
  );
}
