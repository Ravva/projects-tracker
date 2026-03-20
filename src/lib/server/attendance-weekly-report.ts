import "server-only";

import { formatWeekRangeLabel } from "@/lib/server/date-utils";
import type { AttendanceWeekRecord } from "@/lib/types";

type AttendanceState = "present" | "absent" | "unmarked";
type WeeklyStatusState = "critical" | "warning" | "success";

const LESSON_LABELS: Record<string, string> = {
  tue: "Вт",
  thu: "Чт",
  fri: "Пт",
};

function getStateDot(state: AttendanceState) {
  if (state === "present") {
    return "🟢";
  }

  if (state === "absent") {
    return "🔴";
  }

  return "⚪";
}

function getWeeklyStatusState(attendanceRate: number): WeeklyStatusState {
  if (attendanceRate <= 0) {
    return "critical";
  }

  if (attendanceRate < 100) {
    return "warning";
  }

  return "success";
}

function getWeeklyStatusDot(state: WeeklyStatusState) {
  if (state === "critical") {
    return "🔴";
  }

  if (state === "warning") {
    return "🟡";
  }

  return "🟢";
}

function getAttentionToneDot(attendanceRate: number) {
  if (attendanceRate <= 0) {
    return "🔴";
  }

  if (attendanceRate <= 50) {
    return "🟡";
  }

  return "🟢";
}

function compareAttentionRates(left: number, right: number) {
  if (left === 0 && right > 0) {
    return 1;
  }

  if (right === 0 && left > 0) {
    return -1;
  }

  return left - right;
}

export function buildAttendanceWeeklyMarkdownReport(
  attendanceWeek: AttendanceWeekRecord,
) {
  const weekRange = formatWeekRangeLabel(attendanceWeek.weekStart);
  const requiredMin = Math.min(2, attendanceWeek.lessons.length);
  const markedStudents = attendanceWeek.rows.filter((row) =>
    attendanceWeek.lessons.some(
      (lesson) => row.lessonStates[lesson.id] !== "unmarked",
    ),
  ).length;
  const averageAttendance = attendanceWeek.rows.length
    ? Math.round(
        attendanceWeek.rows.reduce((total, row) => {
          const presentCount = attendanceWeek.lessons.reduce(
            (lessonTotal, lesson) =>
              lessonTotal + (row.lessonStates[lesson.id] === "present" ? 1 : 0),
            0,
          );
          const attendanceRate =
            requiredMin > 0
              ? Math.round((presentCount / requiredMin) * 100)
              : 0;

          return total + attendanceRate;
        }, 0) / attendanceWeek.rows.length,
      )
    : 0;

  const lines = [
    `# Отчет по посещаемости`,
    "",
    `Неделя: ${weekRange}. Учеников: ${attendanceWeek.rows.length}. Средняя посещаемость: ${averageAttendance}%. Требуют внимания: ${attendanceWeek.studentsNeedingAttention.length}. Отмечены в журнале: ${markedStudents}/${attendanceWeek.rows.length}.`,
  ];

  if (attendanceWeek.lessons.length > 0) {
    lines.push("");
    lines.push("## Занятия недели");
    lines.push(
      ...attendanceWeek.lessons.map(
        (lesson) =>
          `- ${LESSON_LABELS[lesson.weekdayCode] ?? lesson.title}: ${lesson.dateLabel}`,
      ),
    );
  }

  lines.push("");
  lines.push("## По ученикам");

  if (attendanceWeek.rows.length === 0) {
    lines.push("- Данные недоступны.");
  } else {
    const lessonsByWeekday = new Map(
      attendanceWeek.lessons.map((lesson) => [lesson.weekdayCode, lesson]),
    );

    lines.push(
      ...attendanceWeek.rows.map((row) => {
        const presentCount = attendanceWeek.lessons.reduce(
          (total, lesson) =>
            total + (row.lessonStates[lesson.id] === "present" ? 1 : 0),
          0,
        );
        const attendanceRate =
          requiredMin > 0 ? Math.round((presentCount / requiredMin) * 100) : 0;
        const weeklyStatusDot = getWeeklyStatusDot(
          getWeeklyStatusState(attendanceRate),
        );
        const tuesdayLesson = lessonsByWeekday.get("tue");
        const thursdayLesson = lessonsByWeekday.get("thu");
        const fridayLesson = lessonsByWeekday.get("fri");
        const tuesdayDot = tuesdayLesson
          ? getStateDot(row.lessonStates[tuesdayLesson.id] ?? "unmarked")
          : "—";
        const thursdayDot = thursdayLesson
          ? getStateDot(row.lessonStates[thursdayLesson.id] ?? "unmarked")
          : "—";
        const fridayDot = fridayLesson
          ? getStateDot(row.lessonStates[fridayLesson.id] ?? "unmarked")
          : "—";

        return `${row.student.lastName} ${row.student.firstName}  Вт ${tuesdayDot}  Чт ${thursdayDot}  Пт ${fridayDot}  Неделя ${weeklyStatusDot} ${attendanceRate}%`;
      }),
    );
  }

  if (attendanceWeek.studentsNeedingAttention.length > 0) {
    lines.push("");
    lines.push("## Зона внимания");
    lines.push(
      ...attendanceWeek.studentsNeedingAttention
        .toSorted((left, right) =>
          compareAttentionRates(left.attendanceRate, right.attendanceRate),
        )
        .map(
          (student) =>
            `- ${getAttentionToneDot(student.attendanceRate)} ${student.lastName} ${student.firstName} — ${student.attendanceRate}%`,
        ),
    );
  }

  return lines.join("\n");
}
