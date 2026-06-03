"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  clearAttendanceAction,
  saveAttendanceAction,
} from "@/app/attendance/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
      <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5 animate-none">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Журнал посещений
          </h3>
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Week Selector Group */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-7 rounded-[6px]"
              title="Предыдущая неделя"
            >
              <Link href={`/attendance?weekStart=${previousWeekStart}`}>
                <ChevronLeft className="size-4 text-muted-foreground hover:text-foreground" />
              </Link>
            </Button>
            <span className="px-2.5 text-xs font-semibold text-foreground select-none">
              Неделя: {weekRangeLabel}
            </span>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-7 rounded-[6px]"
              title="Следующая неделя"
            >
              <Link href={`/attendance?weekStart=${nextWeekStart}`}>
                <ChevronRight className="size-4 text-muted-foreground hover:text-foreground" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <form action={clearAttendanceAction}>
              <input type="hidden" name="weekStart" value={weekStart} />
              <Button
                variant="outline"
                size="sm"
                className="bg-background/90 text-xs"
                disabled={isPending}
              >
                Очистить
              </Button>
            </form>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="text-xs"
              disabled={!isDirty || isPending || !hasRows}
              onClick={handleSave}
            >
              {isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </div>
      {error ? (
        <div className="mx-4 my-3 sm:mx-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}
      <Table className="w-full border-collapse font-sans">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[14rem] max-w-[14rem] pl-4 sm:pl-6 text-muted-foreground font-sans font-semibold">
              Ученик
            </TableHead>
            {WEEKDAY_COLUMNS.map((column) => {
              const lesson = lessonsByWeekday.get(column.code);

              return (
                <TableHead key={column.code} className="w-20 text-center px-1">
                  {lesson ? (
                    <button
                      type="button"
                      className="inline-flex flex-col cursor-pointer items-center justify-center rounded-md px-2.5 py-1 text-center transition-colors hover:bg-muted dark:hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPending || !hasRows}
                      onClick={() => handleColumnToggle(lesson.id)}
                      title="Массово переключить весь столбец"
                    >
                      <span
                        className={`text-[10px] font-bold uppercase tracking-[0.08em] ${lessonClosedStates[lesson.id] ? "text-fuchsia-500/80 dark:text-fuchsia-400/80 line-through" : "text-muted-foreground"}`}
                      >
                        {column.label}
                      </span>
                      <span
                        className={`text-[11px] font-medium lowercase mt-0.5 ${lessonClosedStates[lesson.id] ? "text-fuchsia-500/70 dark:text-fuchsia-400/70 font-semibold" : "text-muted-foreground/70"}`}
                      >
                        {lessonClosedStates[lesson.id]
                          ? "отменено"
                          : lesson.dateLabel}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      {column.label}
                    </span>
                  )}
                </TableHead>
              );
            })}
            <TableHead className="w-28 text-center pr-4 sm:pr-6 whitespace-nowrap text-muted-foreground font-sans font-semibold">
              Посещаемость
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-muted-foreground pl-4 pr-4 sm:pl-6 sm:pr-6"
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
                  <TableCell className="max-w-[14rem] py-2.5 pr-2 pl-4 sm:pl-6">
                    <div className="flex items-center gap-2.5 truncate">
                      <Avatar className="size-6 shrink-0">
                        <AvatarFallback className="bg-secondary font-bold text-[9px] text-secondary-foreground">
                          {row.student.lastName[0] || ""}
                          {row.student.firstName[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-xs text-foreground truncate">
                        {row.student.lastName} {row.student.firstName}
                      </div>
                    </div>
                  </TableCell>
                  {WEEKDAY_COLUMNS.map((column) => {
                    const lesson = lessonsByWeekday.get(column.code);

                    if (!lesson) {
                      return (
                        <TableCell
                          key={column.code}
                          className="w-20 px-0.5 py-2"
                        >
                          <div className="text-center text-xs text-muted-foreground">
                            -
                          </div>
                        </TableCell>
                      );
                    }

                    const currentState = lessonClosedStates[lesson.id]
                      ? "cancelled"
                      : (studentStates[lesson.id] ?? "unmarked");

                    return (
                      <TableCell key={column.code} className="w-20 px-0.5 py-2">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            disabled={
                              isPending || lessonClosedStates[lesson.id]
                            }
                            aria-label={STATE_LABELS[currentState]}
                            className="inline-flex size-7 items-center justify-center rounded-full transition-all duration-150 hover:bg-muted/70 dark:hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/40 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            title={STATE_LABELS[currentState]}
                            onClick={() =>
                              handleCellToggle(row.student.id, lesson.id)
                            }
                          >
                            <span
                              className={`inline-flex size-[14px] rounded-full transition-transform active:scale-90 ${getAttendanceDotClassName(currentState)}`}
                            />
                          </button>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="px-0.5 py-2 text-center pr-4 sm:pr-6">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`inline-flex size-3 rounded-full ${getWeeklyStatusDotClassName(weeklyState)}`}
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {attendanceRate}%
                      </span>
                    </div>
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
              size="sm"
              disabled={isPending}
              onClick={handleModalSave}
            >
              {isPending ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleModalDiscard}
            >
              Не сохранять
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
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
