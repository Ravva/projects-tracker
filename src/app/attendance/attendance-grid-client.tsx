"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveAttendanceAction } from "@/app/attendance/actions";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AttendanceGridRow,
  AttendanceLessonRecord,
  WeeklyState,
} from "@/lib/types";

type AttendanceState = "present" | "absent" | "unmarked";

const WEEKDAY_COLUMNS: Array<{
  code: AttendanceLessonRecord["weekdayCode"];
  label: string;
}> = [
  { code: "tue", label: "Вторник" },
  { code: "thu", label: "Четверг" },
  { code: "fri", label: "Пятница" },
];

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

function buildWeeklyState(attendanceRate: number): WeeklyState {
  if (attendanceRate < 25) {
    return "critical";
  }

  if (attendanceRate < 75) {
    return "warning";
  }

  return "success";
}

function buildWeeklyStateLabel(weeklyState: WeeklyState) {
  if (weeklyState === "critical") {
    return "риск";
  }

  if (weeklyState === "warning") {
    return "в работе";
  }

  return "норма";
}

function buildInitialState(rows: AttendanceGridRow[]) {
  return Object.fromEntries(
    rows.map((row) => [row.student.id, { ...row.lessonStates }]),
  ) as Record<string, Record<string, AttendanceState>>;
}

export function AttendanceGridClient({
  lessons,
  nextWeekStart,
  previousWeekStart,
  rows,
  weekRangeLabel,
  weekStart,
}: {
  lessons: AttendanceLessonRecord[];
  nextWeekStart: string;
  previousWeekStart: string;
  rows: AttendanceGridRow[];
  weekRangeLabel: string;
  weekStart: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftStates, setDraftStates] = useState(() => buildInitialState(rows));
  const [error, setError] = useState("");
  const initialStates = buildInitialState(rows);
  const lessonsByWeekday = new Map(
    WEEKDAY_COLUMNS.map(({ code }) => [
      code,
      lessons.find((lesson) => lesson.weekdayCode === code) ?? null,
    ]),
  );
  const requiredMin = Math.min(2, lessons.length);
  const hasRows = rows.length > 0;
  const isDirty = rows.some((row) =>
    Object.entries(initialStates[row.student.id] ?? {}).some(
      ([lessonId, state]) => draftStates[row.student.id]?.[lessonId] !== state,
    ),
  );

  const handleCellToggle = (studentId: string, lessonId: string) => {
    setDraftStates((current) => {
      const studentStates = current[studentId] ?? {};
      const currentState = studentStates[lessonId] ?? "unmarked";

      return {
        ...current,
        [studentId]: {
          ...studentStates,
          [lessonId]: getNextState(currentState),
        },
      };
    });
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.set("weekStart", weekStart);

    rows.forEach((row) => {
      Object.entries(draftStates[row.student.id] ?? {}).forEach(
        ([lessonId, state]) => {
          formData.set(`attendance:${row.student.id}:${lessonId}`, state);
        },
      );
    });

    setError("");
    startTransition(async () => {
      try {
        await saveAttendanceAction(formData);
        router.refresh();
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Не удалось сохранить attendance. Повторите попытку.",
        );
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Неделя: {weekRangeLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl bg-background/90"
            disabled={!isDirty || isPending || !hasRows}
            onClick={handleSave}
          >
            {isPending ? "Сохраняем..." : "Сохранить изменения"}
          </Button>
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
      {error ? (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {isDirty ? (
        <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          Есть несохраненные изменения. Итог недели и данные в базе обновятся
          после нажатия «Сохранить изменения».
        </div>
      ) : null}
      <Table className="mt-4">
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
            rows.map((row) => {
              const studentStates = draftStates[row.student.id] ?? {};
              const presentCount = lessons.reduce(
                (total, lesson) =>
                  total + (studentStates[lesson.id] === "present" ? 1 : 0),
                0,
              );
              const attendanceRate =
                requiredMin > 0
                  ? Math.round((presentCount / requiredMin) * 100)
                  : 0;
              const weeklyState = buildWeeklyState(attendanceRate);

              return (
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

                    const currentState = studentStates[lesson.id] ?? "unmarked";

                    return (
                      <TableCell key={column.code}>
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                            className={`min-w-20 rounded-xl border text-xs font-medium ${STATE_STYLES[currentState]}`}
                            onClick={() =>
                              handleCellToggle(row.student.id, lesson.id)
                            }
                          >
                            {STATE_LABELS[currentState]}
                          </Button>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <StatusPill
                      tone={weeklyState}
                      label={buildWeeklyStateLabel(weeklyState)}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </>
  );
}
