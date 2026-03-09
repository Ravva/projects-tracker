import { Calendar03Icon, User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
import { listAttendanceLessons } from "@/lib/server/repositories/attendance";
import { listStudents } from "@/lib/server/repositories/students";

export default async function AttendancePage() {
  const [attendanceLessons, students] = await Promise.all([
    listAttendanceLessons(),
    listStudents(),
  ]);

  return (
    <TeacherShell
      eyebrow="Weekly attendance"
      title="Attendance"
      actions={
        <>
          <Button variant="outline" className="rounded-xl bg-background/90">
            Очистить отметки
          </Button>
          <Button className="rounded-xl">Отметить всех как был</Button>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-3">
        {attendanceLessons.length === 0 ? (
          <Card className="xl:col-span-3 border-border/70 bg-card/88 shadow-none">
            <CardContent className="py-10 text-center text-muted-foreground">
              Appwrite не настроен или коллекция `lessons` пока пуста.
            </CardContent>
          </Card>
        ) : (
          attendanceLessons.map((lesson) => (
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
              <CardContent className="space-y-2 text-sm text-muted-foreground">
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
                {students.length === 0 ? (
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
                  students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        {index % 2 === 0 ? "Был" : "Не был"}
                      </TableCell>
                      <TableCell>Нет отметки</TableCell>
                      <TableCell>Нет отметки</TableCell>
                      <TableCell className="text-right">
                        <StatusPill
                          tone={student.weeklyState}
                          label={
                            student.weeklyState === "critical"
                              ? "риск"
                              : student.weeklyState === "warning"
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
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Нарушители недели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {students
              .filter((student) => student.weeklyState !== "success")
              .map((student) => (
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
            {students.length === 0 ? (
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
