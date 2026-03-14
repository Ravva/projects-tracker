"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { saveAttendanceAction } from "@/app/attendance/actions";
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

const STATE_ORDER: AttendanceState[] = ["unmarked", "absent", "present"];

const STATE_LABELS: Record<AttendanceState, string> = {
  unmarked: "Нет данных",
  present: "Присутствовал",
  absent: "Отсутствовал",
};

function getNextState(state: AttendanceState) {
  const index = STATE_ORDER.indexOf(state);

  return STATE_ORDER[(index + 1) % STATE_ORDER.length];
}

function buildWeeklyState(attendanceRate: number): WeeklyState {
  if (attendanceRate <= 0) {
    return "critical";
  }

  if (attendanceRate < 100) {
    return "warning";
  }

  return "success";
}

function getAttendanceDotClassName(state: AttendanceState) {
  if (state === "absent") {
    return "bg-[hsl(var(--status-critical))] shadow-[0_0_0_1px_hsl(var(--status-critical)/0.24)]";
  }

  if (state === "present") {
    return "bg-[hsl(var(--status-success))] shadow-[0_0_0_1px_hsl(var(--status-success)/0.22)]";
  }

  return "bg-background shadow-[0_0_0_1px_hsl(var(--border))]";
}

function getWeeklyStatusDotClassName(weeklyState: WeeklyState) {
  if (weeklyState === "critical") {
    return "bg-[hsl(var(--status-critical))] shadow-[0_0_0_1px_hsl(var(--status-critical)/0.24)]";
  }

  if (weeklyState === "warning") {
    return "bg-[hsl(var(--status-warning))] shadow-[0_0_0_1px_hsl(var(--status-warning)/0.24)]";
  }

  return "bg-[hsl(var(--status-success))] shadow-[0_0_0_1px_hsl(var(--status-success)/0.22)]";
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

  useEffect(() => {
    setDraftStates(buildInitialState(rows));
  }, [rows]);

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

  const handleColumnToggle = (lessonId: string) => {
    setDraftStates((current) => {
      const columnStates = rows.map(
        (row) => current[row.student.id]?.[lessonId] ?? "unmarked",
      );
      const allSame = columnStates.every((state) => state === columnStates[0]);
      const nextState = allSame
        ? getNextState(columnStates[0] ?? "unmarked")
        : "absent";

      return Object.fromEntries(
        rows.map((row) => [
          row.student.id,
          {
            ...(current[row.student.id] ?? {}),
            [lessonId]: nextState,
          },
        ]),
      );
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
      <Table className="mt-4 w-auto min-w-[34rem]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[18rem] text-sm">Ученик</TableHead>
            {WEEKDAY_COLUMNS.map((column) => {
              const lesson = lessonsByWeekday.get(column.code);

              return (
                <TableHead
                  key={column.code}
                  className="w-24 px-1 text-center text-sm"
                >
                  {lesson ? (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg px-2 py-1 text-center text-sm transition-colors hover:bg-accent/25"
                      disabled={isPending || !hasRows}
                      onClick={() => handleColumnToggle(lesson.id)}
                    >
                      {column.label}
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              );
            })}
            <TableHead className="w-24 px-1 text-center text-sm">
              Статус недели
            </TableHead>
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
                  <TableCell className="py-2 text-sm font-medium">
                    {row.student.lastName} {row.student.firstName}
                  </TableCell>
                  {WEEKDAY_COLUMNS.map((column) => {
                    const lesson = lessonsByWeekday.get(column.code);

                    if (!lesson) {
                      return (
                        <TableCell key={column.code} className="px-1 py-2">
                          <div className="text-center text-base text-muted-foreground">
                            -
                          </div>
                        </TableCell>
                      );
                    }

                    const currentState = studentStates[lesson.id] ?? "unmarked";

                    return (
                      <TableCell key={column.code} className="px-1 py-2">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            disabled={isPending}
                            aria-label={STATE_LABELS[currentState]}
                            className="inline-flex items-center justify-center rounded-full p-1.5 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                            title={STATE_LABELS[currentState]}
                            onClick={() =>
                              handleCellToggle(row.student.id, lesson.id)
                            }
                          >
                            <span
                              className={`inline-flex size-4 rounded-full ${getAttendanceDotClassName(currentState)}`}
                            />
                          </button>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="px-1 py-2 text-center">
                    <span
                      className="inline-flex items-center"
                      title={`Статус недели: ${attendanceRate}%`}
                    >
                      <span
                        className={`inline-flex size-4 rounded-full ${getWeeklyStatusDotClassName(weeklyState)}`}
                      />
                      <span className="sr-only">
                        Статус недели {attendanceRate}%
                      </span>
                    </span>
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
