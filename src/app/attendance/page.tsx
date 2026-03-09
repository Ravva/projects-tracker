import { Calendar03Icon, User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  clearAttendanceAction,
  deleteLessonAction,
  markAllPresentAction,
  saveAttendanceAction,
} from "@/app/attendance/actions";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireTeacherSession } from "@/lib/server/auth";
import { getCurrentAttendanceWeek } from "@/lib/server/repositories/attendance";

export default async function AttendancePage() {
  const teacher = await requireTeacherSession();
  const attendanceWeek = await getCurrentAttendanceWeek();
  const { lessons, rows, studentsNeedingAttention, weekStart } = attendanceWeek;

  return (
    <TeacherShell
      eyebrow="Weekly attendance"
      title="Attendance"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <>
          <form action={clearAttendanceAction}>
            <input type="hidden" name="weekStart" value={weekStart} />
            <Button variant="outline" className="rounded-xl bg-background/90">
              Очистить отметки
            </Button>
          </form>
          <Button asChild className="rounded-xl">
            <a href="#attendance-grid">Сохранить неделю</a>
          </Button>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-3">
        {lessons.length === 0 ? (
          <Card className="xl:col-span-3 border-border/70 bg-card/88 shadow-none">
            <CardContent className="py-10 text-center text-muted-foreground">
              Appwrite не настроен или коллекция `lessons` пока пуста.
            </CardContent>
          </Card>
        ) : (
          lessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="border-border/70 bg-card/88 shadow-none"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-3">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                    {lesson.title}
                  </span>
                  <StatusPill
                    tone={lesson.missingMarks > 0 ? "warning" : "success"}
                    label={lesson.dateLabel}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <form action={markAllPresentAction}>
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <Button
                      variant="outline"
                      className="rounded-xl bg-background/90"
                    >
                      Все были
                    </Button>
                  </form>
                  <form action={deleteLessonAction}>
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <Button
                      variant="outline"
                      className="rounded-xl bg-background/90"
                    >
                      Удалить
                    </Button>
                  </form>
                </div>
                <div className="flex items-center justify-between">
                  <span>Отметки проставлены</span>
                  <span className="font-medium text-foreground">
                    {lesson.attendanceMarked}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Без отметки</span>
                  <span className="font-medium text-foreground">
                    {lesson.missingMarks}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly attendance grid</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="attendance-grid" action={saveAttendanceAction}>
              <input type="hidden" name="weekStart" value={weekStart} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ученик</TableHead>
                    <TableHead>Вторник</TableHead>
                    <TableHead>Четверг</TableHead>
                    <TableHead>Пятница</TableHead>
                    <TableHead className="text-right">Статус недели</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Сначала подключите коллекции `students` и `lessons` в
                        Appwrite.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.student.id}>
                        <TableCell className="font-medium">
                          {row.student.firstName} {row.student.lastName}
                        </TableCell>
                        {lessons.map((lesson) => (
                          <TableCell key={lesson.id}>
                            <select
                              name={`attendance:${row.student.id}:${lesson.id}`}
                              defaultValue={row.lessonStates[lesson.id]}
                              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                            >
                              <option value="unmarked">Нет отметки</option>
                              <option value="present">Был</option>
                              <option value="absent">Не был</option>
                            </select>
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <StatusPill
                            tone={row.student.weeklyState}
                            label={
                              row.student.weeklyState === "critical"
                                ? "риск"
                                : row.student.weeklyState === "warning"
                                  ? "в работе"
                                  : "норма"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Button type="submit" className="mt-4 rounded-xl">
                Сохранить attendance
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Нарушители недели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentsNeedingAttention.map((student) => (
              <div
                key={student.id}
                className="rounded-2xl border border-border/70 bg-background/70 p-4"
              >
                <div className="flex items-center gap-3 font-medium">
                  <HugeiconsIcon
                    icon={User02Icon}
                    size={18}
                    strokeWidth={1.8}
                  />
                  {student.firstName} {student.lastName}
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {student.attendanceRate}% нормы
                  </span>
                  <StatusPill
                    tone={student.weeklyState}
                    label="требует внимания"
                  />
                </div>
              </div>
            ))}
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                Нет данных для weekly monitoring.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </TeacherShell>
  );
}
