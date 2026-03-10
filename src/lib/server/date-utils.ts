import type { AttendanceLessonRecord } from "@/lib/types";

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS: Record<AttendanceLessonRecord["weekdayCode"], string> = {
  tue: "Вторник",
  thu: "Четверг",
  fri: "Пятница",
};

export function startOfCurrentWeek(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setHours(0, 0, 0, 0);
  current.setDate(current.getDate() + diff);

  return current;
}

export function startOfWeek(date: Date) {
  return startOfCurrentWeek(date);
}

export function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);

  return next;
}

export function buildWeekTemplate(weekStart = startOfCurrentWeek()) {
  const normalized = new Date(weekStart);
  normalized.setHours(0, 0, 0, 0);

  return [
    {
      weekdayCode: "tue" as const,
      title: WEEKDAY_LABELS.tue,
      lessonDate: toIsoDate(addDays(normalized, 1)),
    },
    {
      weekdayCode: "thu" as const,
      title: WEEKDAY_LABELS.thu,
      lessonDate: toIsoDate(addDays(normalized, 3)),
    },
    {
      weekdayCode: "fri" as const,
      title: WEEKDAY_LABELS.fri,
      lessonDate: toIsoDate(addDays(normalized, 4)),
    },
  ];
}

export function formatDateLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

export function parseIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function normalizeWeekStart(isoDate?: string | null) {
  if (!isoDate) {
    return toIsoDate(startOfCurrentWeek());
  }

  const parsed = parseIsoDate(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    return toIsoDate(startOfCurrentWeek());
  }

  return toIsoDate(startOfWeek(parsed));
}

export function formatWeekRangeLabel(weekStartIso: string) {
  const weekStart = parseIsoDate(weekStartIso);
  const weekEnd = addDays(weekStart, 4);
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
  });

  return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
}

export function daysSince(isoDate: string | null | undefined) {
  if (!isoDate) {
    return Number.POSITIVE_INFINITY;
  }

  const target = new Date(isoDate);

  if (Number.isNaN(target.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - target.getTime()) / MS_IN_DAY);
}
