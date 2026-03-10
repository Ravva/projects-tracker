import {
  AiBrain03Icon,
  Alert01Icon,
  Calendar03Icon,
  ChartUpIcon,
  Github01Icon,
  Notification01Icon,
  Task01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { MetricBadge, MetricCard } from "@/components/app/metric-card";
import { SendWeeklyDigestButton } from "@/components/app/send-weekly-digest-button";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseIsoDate } from "@/lib/server/date-utils";
import { getCurrentAttendanceWeek } from "@/lib/server/repositories/attendance";
import { listProjects } from "@/lib/server/repositories/projects";
import { listStudents } from "@/lib/server/repositories/students";
import type { AttendanceLessonRecord, TeacherSessionUser } from "@/lib/types";

function getNearestLesson(lessons: AttendanceLessonRecord[]) {
  if (lessons.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    lessons.find((lesson) => parseIsoDate(lesson.lessonDate) >= today) ??
    lessons[lessons.length - 1]
  );
}

export async function TeacherDashboard({
  teacher,
}: {
  teacher: TeacherSessionUser;
}) {
  const [students, projects, attendanceWeek] = await Promise.all([
    listStudents(),
    listProjects(),
    getCurrentAttendanceWeek(),
  ]);
  const attendanceLessons = attendanceWeek.lessons;
  const nearestLesson = getNearestLesson(attendanceLessons);

  const studentsNeedingAttention = students.filter(
    (student) => student.weeklyState !== "success",
  );
  const riskyProjects = projects.filter((project) => project.progress < 50);
  const filledChatIds = students.filter(
    (student) => student.telegramChatId,
  ).length;
  const averageAttendance = students.length
    ? Math.round(
        students.reduce((total, student) => total + student.attendanceRate, 0) /
          students.length,
      )
    : 0;

  return (
    <TeacherShell
      eyebrow="Academic Control Room"
      title="Teacher Dashboard"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <>
          <SendWeeklyDigestButton />
          <Button
            asChild
            variant="outline"
            className="rounded-xl bg-background/90"
          >
            <Link href="/attendance">Открыть attendance</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-xl">Быстрые действия</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Открыть текущую неделю</DropdownMenuItem>
              <DropdownMenuItem>Запустить GitHub sync</DropdownMenuItem>
              <DropdownMenuItem>Запустить AI-анализ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden border-border/70 bg-card/85 shadow-none">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="border-transparent bg-[hsl(var(--status-calm)/0.14)] text-[hsl(var(--status-calm))]"
              >
                Teacher-only обзор системы
              </Badge>
              <div className="space-y-2">
                <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight">
                  Один экран для посещаемости, project health и AI-контроля.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Дашборд теперь работает только через Appwrite-ready data
                  layer. Если коллекции еще не настроены, интерфейс покажет
                  пустые состояния до подключения реальных записей.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/75 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Ближайшее занятие
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {nearestLesson?.dateLabel ?? "Нет данных"}
                  </div>
                </div>
                <div className="rounded-2xl bg-[hsl(var(--status-warning)/0.16)] p-3 text-[hsl(var(--status-warning))]">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={22}
                    strokeWidth={1.8}
                  />
                </div>
              </div>
              <Separator className="my-5" />
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Активных учеников
                  </span>
                  <span className="font-medium">{students.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Проектов в работе
                  </span>
                  <span className="font-medium">{projects.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Telegram chat id заполнен
                  </span>
                  <span className="font-medium">
                    {filledChatIds}/{students.length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-base">
              Фокус недели
              <StatusPill
                label={`${studentsNeedingAttention.length} риска`}
                tone={
                  studentsNeedingAttention.length > 0 ? "warning" : "success"
                }
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentsNeedingAttention.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Нет активных weekly alerts. Подключите Appwrite или добавьте
                данные в коллекции.
              </div>
            ) : (
              studentsNeedingAttention.slice(0, 3).map((student) => (
                <div
                  key={student.id}
                  className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6"
                >
                  {student.firstName} {student.lastName}: посещаемость{" "}
                  {student.attendanceRate}%,
                  {student.telegramChatId
                    ? " chat id заполнен."
                    : " chat id отсутствует."}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          title="Нарушители недели"
          value={String(studentsNeedingAttention.length)}
          description="Ученики, которые еще не закрыли недельную норму посещаемости."
          tone={studentsNeedingAttention.length > 0 ? "critical" : "success"}
          icon={Alert01Icon}
          progress={students.length ? Math.max(0, 100 - averageAttendance) : 0}
          badge={
            <MetricBadge
              label={studentsNeedingAttention.length > 0 ? "критично" : "чисто"}
              tone={
                studentsNeedingAttention.length > 0 ? "critical" : "success"
              }
            />
          }
        />
        <MetricCard
          title="Проекты в review-зоне"
          value={String(riskyProjects.length)}
          description="Требуют ручной проверки: низкий progress, stale state или mismatch."
          tone={riskyProjects.length > 0 ? "warning" : "success"}
          icon={Github01Icon}
          progress={
            projects.length
              ? Math.round((riskyProjects.length / projects.length) * 100)
              : 0
          }
          badge={
            <MetricBadge
              label={riskyProjects.length > 0 ? "внимание" : "стабильно"}
              tone={riskyProjects.length > 0 ? "warning" : "success"}
            />
          }
        />
        <MetricCard
          title="AI-отчеты доступны"
          value={String(projects.filter((project) => project.aiSummary).length)}
          description="Количество проектов, у которых уже есть AI summary в текущем слое данных."
          tone="calm"
          icon={AiBrain03Icon}
          progress={
            projects.length
              ? Math.round(
                  (projects.filter((project) => project.aiSummary).length /
                    projects.length) *
                    100,
                )
              : 0
          }
          badge={<MetricBadge label="данные" tone="calm" />}
        />
        <MetricCard
          title="Посещаемость недели"
          value={`${averageAttendance}%`}
          description="Средний уровень выполнения нормы по доступным student records."
          tone={
            averageAttendance >= 75
              ? "success"
              : averageAttendance >= 25
                ? "warning"
                : "critical"
          }
          icon={ChartUpIcon}
          progress={averageAttendance}
          badge={
            <MetricBadge
              label={averageAttendance >= 75 ? "стабильно" : "контроль"}
              tone={averageAttendance >= 75 ? "success" : "warning"}
            />
          }
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">
                Ученики, требующие действия
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Teacher-only список для быстрого weekly контроля.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-xl bg-background/90"
            >
              <Link href="/attendance">Открыть журнал посещаемости</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {studentsNeedingAttention.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-6 text-sm text-muted-foreground">
                Нет записей для teacher review.
              </div>
            ) : (
              studentsNeedingAttention.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.attendanceRate}% нормы
                      </div>
                    </div>
                  </div>
                  <StatusPill
                    tone={student.weeklyState}
                    label="требует внимания"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Последние AI-отчеты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.filter((project) => project.aiSummary).length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                AI summaries пока отсутствуют.
              </div>
            ) : (
              projects
                .filter((project) => project.aiSummary)
                .slice(0, 3)
                .map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">{project.name}</div>
                      <Badge variant="outline" className="rounded-full">
                        {project.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {project.aiSummary}
                    </p>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">
                Проекты в зоне контроля
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Риски, требующие teacher review до следующего weekly digest.
              </p>
            </div>
            <StatusPill
              label={`${riskyProjects.length} проекта`}
              tone="warning"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ученик</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead>Риск</TableHead>
                  <TableHead className="text-right">Прогресс</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskyProjects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Нет проектов в зоне контроля.
                    </TableCell>
                  </TableRow>
                ) : (
                  riskyProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.studentName}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/projects/${project.id}`}
                          className="transition-colors hover:text-primary"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={project.progress < 25 ? "critical" : "warning"}
                          label={project.risk}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {project.progress}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Каналы контроля</CardTitle>
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
                Персональные уведомления и общий чат учеников зависят от
                `telegram_chat_id` в данных.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon icon={User02Icon} size={18} strokeWidth={1.8} />
                Ученики
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                Сейчас в слое данных доступно {students.length} student records.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon icon={Task01Icon} size={18} strokeWidth={1.8} />
                Weekly контроль
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                Фокус на пропусках, stale repos и низком completion percent в
                едином server-side data layer.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </TeacherShell>
  );
}
