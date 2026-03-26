"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  clearAttendanceAction,
  saveAttendanceAction,
} from "@/app/attendance/actions";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/ui/feedback-modal";
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
  AttendanceState,
  WeeklyState,
} from "@/lib/types";

const WEEKDAY_COLUMNS: Array<{
  code: AttendanceLessonRecord["weekdayCode"];
  label: string;
}> = [
  { code: "tue", label: "Вторник" },
  { code: "thu", label: "Четверг" },
  { code: "fri", label: "Пятница" },
];

const STATE_ORDER: Array<Exclude<AttendanceState, "cancelled">> = [
  "unmarked",
  "absent",
  "present",
];
const COLUMN_STATE_ORDER: AttendanceState[] = [
  "unmarked",
  "absent",
  "present",
  "cancelled",
];

const STATE_LABELS: Record<AttendanceState, string> = {
  unmarked: "Нет данных",
  present: "Присутствовал",
  absent: "Отсутствовал",
  cancelled: "Не состоялось",
};

function getNextState(state: Exclude<AttendanceState, "cancelled">) {
  const index = STATE_ORDER.indexOf(state);

  return STATE_ORDER[(index + 1) % STATE_ORDER.length];
}

function getNextColumnState(state: AttendanceState) {
  const index = COLUMN_STATE_ORDER.indexOf(state);

  return COLUMN_STATE_ORDER[(index + 1) % COLUMN_STATE_ORDER.length];
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
  if (state === "cancelled") {
    return "bg-fuchsia-500 shadow-[0_0_0_1px_rgba(217,70,239,0.34)] dark:bg-fuchsia-400";
  }

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

const ATTENDANCE_LEGEND_ITEMS: Array<{
  label: string;
  state: AttendanceState | WeeklyState;
}> = [
  { label: "Нет данных", state: "unmarked" },
  { label: "Отсутствовал", state: "absent" },
  { label: "Присутствовал", state: "present" },
  { label: "Не состоялось", state: "cancelled" },
];

function buildInitialState(rows: AttendanceGridRow[]) {
  return Object.fromEntries(
    rows.map((row) => [
      row.student.id,
      Object.fromEntries(
        Object.entries(row.lessonStates).map(([lessonId, state]) => [
          lessonId,
          state === "cancelled" ? "unmarked" : state,
        ]),
      ),
    ]),
  ) as Record<string, Record<string, AttendanceState>>;
}

function buildInitialLessonClosedState(lessons: AttendanceLessonRecord[]) {
  return Object.fromEntries(
    lessons.map((lesson) => [lesson.id, lesson.isClosed]),
  ) as Record<string, boolean>;
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
  const [lessonClosedStates, setLessonClosedStates] = useState(() =>
    buildInitialLessonClosedState(lessons),
  );
  const [error, setError] = useState("");
  const [pendingNavigationHref, setPendingNavigationHref] = useState<
    string | null
  >(null);
  const skipNavigationGuardRef = useRef(false);
  const initialStates = buildInitialState(rows);
  const initialLessonClosedStates = buildInitialLessonClosedState(lessons);
  const lessonsByWeekday = new Map(
    WEEKDAY_COLUMNS.map(({ code }) => [
      code,
      lessons.find((lesson) => lesson.weekdayCode === code) ?? null,
    ]),
  );
  const hasRows = rows.length > 0;
  const hasCellChanges = rows.some((row) =>
    Object.entries(initialStates[row.student.id] ?? {}).some(
      ([lessonId, state]) => draftStates[row.student.id]?.[lessonId] !== state,
    ),
  );
  const hasLessonChanges = lessons.some(
    (lesson) =>
      lessonClosedStates[lesson.id] !== initialLessonClosedStates[lesson.id],
  );
  const isDirty = hasCellChanges || hasLessonChanges;

  useEffect(() => {
    setDraftStates(buildInitialState(rows));
  }, [rows]);

  useEffect(() => {
    setLessonClosedStates(buildInitialLessonClosedState(lessons));
  }, [lessons]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        !isDirty ||
        skipNavigationGuardRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel") === "external"
      ) {
        return;
      }

      const destinationUrl = new URL(anchor.href, window.location.href);

      if (
        destinationUrl.origin !== window.location.origin ||
        destinationUrl.href === window.location.href
      ) {
        return;
      }

      event.preventDefault();
      setPendingNavigationHref(
        `${destinationUrl.pathname}${destinationUrl.search}${destinationUrl.hash}`,
      );
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty]);

  const handleCellToggle = (studentId: string, lessonId: string) => {
    if (lessonClosedStates[lessonId]) {
      return;
    }

    setDraftStates((current) => {
      const studentStates = current[studentId] ?? {};
      const currentState = studentStates[lessonId];
      const nextBaseState =
        currentState === "present" ||
        currentState === "absent" ||
        currentState === "unmarked"
          ? currentState
          : "unmarked";

      return {
        ...current,
        [studentId]: {
          ...studentStates,
          [lessonId]: getNextState(nextBaseState),
        },
      };
    });
  };

  const handleColumnToggle = (lessonId: string) => {
    setDraftStates((current) => {
      const columnState = lessonClosedStates[lessonId]
        ? "cancelled"
        : rows.every((row) => current[row.student.id]?.[lessonId] === "present")
          ? "present"
          : rows.every(
                (row) => current[row.student.id]?.[lessonId] === "absent",
              )
            ? "absent"
            : rows.every(
                  (row) =>
                    (current[row.student.id]?.[lessonId] ?? "unmarked") ===
                    "unmarked",
                )
              ? "unmarked"
              : "unmarked";
      const nextColumnState = getNextColumnState(columnState);

      setLessonClosedStates((closedState) => ({
        ...closedState,
        [lessonId]: nextColumnState === "cancelled",
      }));

      if (nextColumnState === "cancelled") {
        return current;
      }

      const columnStates = rows.map((row) => {
        const state = current[row.student.id]?.[lessonId];
        return state === "present" || state === "absent" || state === "unmarked"
          ? state
          : "unmarked";
      });
      const allSame = columnStates.every((state) => state === columnStates[0]);
      const nextState =
        nextColumnState === "present" ||
        nextColumnState === "absent" ||
        nextColumnState === "unmarked"
          ? nextColumnState
          : allSame
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

  const saveDraft = async () => {
    const formData = new FormData();
    formData.set("weekStart", weekStart);

    lessons.forEach((lesson) => {
      formData.set(
        `lessonClosed:${lesson.id}`,
        String(lessonClosedStates[lesson.id]),
      );
    });

    rows.forEach((row) => {
      Object.entries(draftStates[row.student.id] ?? {}).forEach(
        ([lessonId, state]) => {
          formData.set(`attendance:${row.student.id}:${lessonId}`, state);
        },
      );
    });

    setError("");
    try {
      await saveAttendanceAction(formData);
      router.refresh();

      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить attendance. Повторите попытку.",
      );

      return false;
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      await saveDraft();
    });
  };

  const continueNavigation = (href: string) => {
    skipNavigationGuardRef.current = true;
    setPendingNavigationHref(null);
    router.push(href);
  };

  const handleModalSave = () => {
    if (!pendingNavigationHref) {
      return;
    }

    startTransition(async () => {
      const saved = await saveDraft();

      if (saved) {
        continueNavigation(pendingNavigationHref);
      }
    });
  };

  const handleModalDiscard = () => {
    if (!pendingNavigationHref) {
      return;
    }

    continueNavigation(pendingNavigationHref);
  };

  const handleModalCancel = () => {
    setPendingNavigationHref(null);
  };

  const activeLessons = lessons.filter(
    (lesson) => !lessonClosedStates[lesson.id],
  );
  const requiredMin = Math.min(2, activeLessons.length);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Неделя: {weekRangeLabel}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {ATTENDANCE_LEGEND_ITEMS.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2">
                <span
                  className={`inline-flex size-3 rounded-full ${
                    item.state === "critical" ||
                    item.state === "warning" ||
                    item.state === "success"
                      ? getWeeklyStatusDotClassName(item.state)
                      : getAttendanceDotClassName(item.state)
                  }`}
                />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={clearAttendanceAction}>
            <input type="hidden" name="weekStart" value={weekStart} />
            <Button
              variant="outline"
              className="rounded-xl bg-background/90"
              disabled={isPending}
            >
              Очистить отметки
            </Button>
          </form>
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
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg px-2 py-1 text-center text-sm transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPending || !hasRows}
                      onClick={() => handleColumnToggle(lesson.id)}
                      title="Массово переключить весь столбец"
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
              const presentCount = activeLessons.reduce(
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

                    const currentState = lessonClosedStates[lesson.id]
                      ? "cancelled"
                      : (studentStates[lesson.id] ?? "unmarked");

                    return (
                      <TableCell key={column.code} className="px-1 py-2">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            disabled={
                              isPending || lessonClosedStates[lesson.id]
                            }
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
      <FeedbackModal
        open={pendingNavigationHref !== null}
        tone="error"
        title="Есть несохраненные изменения"
        description="График посещений изменен, но еще не сохранен. Сохранить изменения перед уходом со страницы?"
        onClose={handleModalCancel}
        footer={
          <>
            <Button
              type="button"
              className="rounded-xl"
              disabled={isPending}
              onClick={handleModalSave}
            >
              {isPending ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending}
              onClick={handleModalDiscard}
            >
              Не сохранять
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending}
              onClick={handleModalCancel}
            >
              Отмена
            </Button>
          </>
        }
      />
    </>
  );
}
