import "server-only";

import { formatWeekRangeLabel } from "@/lib/server/date-utils";
import type { AttendanceWeekRecord } from "@/lib/types";

type AttendanceState = "present" | "absent" | "unmarked";
type WeeklyStatusState = "critical" | "warning" | "success";

export interface AttendanceReportLesson {
  weekdayLabel: string;
  dateLabel: string;
}

export interface AttendanceReportRow {
  studentName: string;
  tuesdayState: AttendanceState | null;
  thursdayState: AttendanceState | null;
  fridayState: AttendanceState | null;
  weeklyStatus: WeeklyStatusState;
  attendanceRate: number;
}

export interface AttendanceAttentionItem {
  studentName: string;
  attendanceRate: number;
  tone: WeeklyStatusState;
}

export interface AttendanceReportData {
  weekRangeLabel: string;
  studentCount: number;
  averageAttendance: number;
  studentsNeedingAttentionCount: number;
  markedStudentsCount: number;
  lessons: AttendanceReportLesson[];
  rows: AttendanceReportRow[];
  attentionItems: AttendanceAttentionItem[];
}

const WEEKDAY_LABELS = {
  tue: "Вторник",
  thu: "Четверг",
  fri: "Пятница",
} as const;

function getWeeklyStatusState(attendanceRate: number): WeeklyStatusState {
  if (attendanceRate <= 0) {
    return "critical";
  }

  if (attendanceRate < 100) {
    return "warning";
  }

  return "success";
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

export function buildAttendanceReportData(
  attendanceWeek: AttendanceWeekRecord,
): AttendanceReportData {
  const weekRangeLabel = formatWeekRangeLabel(attendanceWeek.weekStart);
  const requiredMin = Math.min(2, attendanceWeek.lessons.length);
  const markedStudentsCount = attendanceWeek.rows.filter((row) =>
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
  const lessonsByWeekday = new Map(
    attendanceWeek.lessons.map((lesson) => [lesson.weekdayCode, lesson]),
  );
  const lessons = attendanceWeek.lessons.map((lesson) => ({
    weekdayLabel: WEEKDAY_LABELS[lesson.weekdayCode] ?? lesson.title,
    dateLabel: lesson.dateLabel,
  }));
  const rows = attendanceWeek.rows.map((row) => {
    const presentCount = attendanceWeek.lessons.reduce(
      (total, lesson) =>
        total + (row.lessonStates[lesson.id] === "present" ? 1 : 0),
      0,
    );
    const attendanceRate =
      requiredMin > 0 ? Math.round((presentCount / requiredMin) * 100) : 0;
    const tuesdayLesson = lessonsByWeekday.get("tue");
    const thursdayLesson = lessonsByWeekday.get("thu");
    const fridayLesson = lessonsByWeekday.get("fri");

    return {
      studentName: `${row.student.lastName} ${row.student.firstName}`,
      tuesdayState: tuesdayLesson
        ? (row.lessonStates[tuesdayLesson.id] ?? "unmarked")
        : null,
      thursdayState: thursdayLesson
        ? (row.lessonStates[thursdayLesson.id] ?? "unmarked")
        : null,
      fridayState: fridayLesson
        ? (row.lessonStates[fridayLesson.id] ?? "unmarked")
        : null,
      weeklyStatus: getWeeklyStatusState(attendanceRate),
      attendanceRate,
    };
  });
  const attentionItems = attendanceWeek.studentsNeedingAttention
    .toSorted((left, right) =>
      compareAttentionRates(left.attendanceRate, right.attendanceRate),
    )
    .map((student) => ({
      studentName: `${student.lastName} ${student.firstName}`,
      attendanceRate: student.attendanceRate,
      tone: getWeeklyStatusState(student.attendanceRate),
    }));

  return {
    weekRangeLabel,
    studentCount: attendanceWeek.rows.length,
    averageAttendance,
    studentsNeedingAttentionCount:
      attendanceWeek.studentsNeedingAttention.length,
    markedStudentsCount,
    lessons,
    rows,
    attentionItems,
  };
}
