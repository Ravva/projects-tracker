import Link from "next/link";

import {
  clearAttendanceAction,
  setAttendanceCellAction,
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
import { formatWeekRangeLabel } from "@/lib/server/date-utils";
import {
  getAttendanceWeek,
  shiftWeekStart,
} from "@/lib/server/repositories/attendance";
import type { AttendanceLessonRecord } from "@/lib/types";

const WEEKDAY_COLUMNS: Array<{
  code: AttendanceLessonRecord["weekdayCode"];
  label: string;
}> = [
  { code: "tue", label: "Вторник" },
  { code: "thu", label: "Четверг" },
  { code: "fri", label: "Пятница" },
];

type AttendanceState = "present" | "absent" | "unmarked";

const STATE_ORDER: AttendanceState[] = ["unmarked", "present", "absent"];

const STATE_LABELS: Record<AttendanceState, string> = {
  unmarked: "-",
  present: "Был",
  absent: "Не был",
};

const STATE_STYLES: Record<AttendanceState, string> = {
  unmarked:
    "border-border bg-background text-muted-foreground hover:bg-muted/50",
  present:
    "border-transparent bg-[hsl(var(--status-success)/0.16)] text-[hsl(var(--status-success))] hover:bg-[hsl(var(--status-success)/0.22)]",
  absent:
    "border-transparent bg-[hsl(var(--status-critical)/0.14)] text-[hsl(var(--status-critical))] hover:bg-[hsl(var(--status-critical)/0.2)]",
};

function getNextState(state: AttendanceState) {
  const index = STATE_ORDER.indexOf(state);

  return STATE_ORDER[(index + 1) % STATE_ORDER.length];
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string }>;
}) {
  const teacher = await requireTeacherSession();
  const { weekStart: requestedWeekStart } = await searchParams;
  const attendanceWeek = await getAttendanceWeek(requestedWeekStart);
  const { lessons, rows, weekStart } = attendanceWeek;
  const previousWeekStart = shiftWeekStart(weekStart, -1);
  const nextWeekStart = shiftWeekStart(weekStart, 1);
  const weekRangeLabel = formatWeekRangeLabel(weekStart);
  const lessonsByWeekday = new Map(
    WEEKDAY_COLUMNS.map(({ code }) => [
      code,
      lessons.find((lesson) => lesson.weekdayCode === code) ?? null,
    ]),
  );

  return (
    <TeacherShell
      eyebrow="Weekly attendance"
      title="Attendance"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <form action={clearAttendanceAction}>
          <input type="hidden" name="weekStart" value={weekStart} />
          <Button variant="outline" className="rounded-xl bg-background/90">
            Очистить отметки
          </Button>
        </form>
      }
    >
      <section>
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  Weekly attendance grid
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Неделя: {weekRangeLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl bg-background/90"
                >
                  <Link href={`/attendance?weekStart=${previousWeekStart}`}>
                    Предыдущая неделя
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl bg-background/90"
                >
                  <Link href={`/attendance?weekStart=${nextWeekStart}`}>
                    Следующая неделя
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ученик</TableHead>
                  {WEEKDAY_COLUMNS.map((column) => (
                    <TableHead key={column.code} className="text-center">
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Статус недели</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Appwrite не настроен или данные занятий пока недоступны.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.student.id}>
                      <TableCell className="font-medium">
                        {row.student.firstName} {row.student.lastName}
                      </TableCell>
                      {WEEKDAY_COLUMNS.map((column) => {
                        const lesson = lessonsByWeekday.get(column.code);

                        if (!lesson) {
                          return (
                            <TableCell key={column.code}>
                              <div className="text-center text-sm text-muted-foreground">
                                -
                              </div>
                            </TableCell>
                          );
                        }

                        const currentState =
                          row.lessonStates[lesson.id] ?? "unmarked";
                        const nextState = getNextState(currentState);

                        return (
                          <TableCell key={column.code}>
                            <form
                              action={setAttendanceCellAction}
                              className="flex justify-center"
                            >
                              <input
                                type="hidden"
                                name="weekStart"
                                value={weekStart}
                              />
                              <input
                                type="hidden"
                                name="studentId"
                                value={row.student.id}
                              />
                              <input
                                type="hidden"
                                name="lessonId"
                                value={lesson.id}
                              />
                              <input
                                type="hidden"
                                name="state"
                                value={nextState}
                              />
                              <Button
                                type="submit"
                                variant="outline"
                                className={`min-w-20 rounded-xl border text-xs font-medium ${STATE_STYLES[currentState]}`}
                              >
                                {STATE_LABELS[currentState]}
                              </Button>
                            </form>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
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
          </CardContent>
        </Card>
      </section>
    </TeacherShell>
  );
}
