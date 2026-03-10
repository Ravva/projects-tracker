import "server-only";

import { formatWeekRangeLabel } from "@/lib/server/date-utils";
import { getCurrentAttendanceWeek } from "@/lib/server/repositories/attendance";
import { listProjects } from "@/lib/server/repositories/projects";
import { listStudents } from "@/lib/server/repositories/students";
import {
  sendTelegramMessage,
  TELEGRAM_CHAT_ID_PATTERN,
} from "@/lib/server/telegram";

const TEACHER_TELEGRAM_CHAT_ID =
  process.env.TEACHER_TELEGRAM_CHAT_ID?.trim() ?? "";

export interface TeacherWeeklyDigestResult {
  weekRange: string;
  averageAttendance: number;
  studentsNeedingAttention: number;
  riskyProjects: number;
  deliveredToChatId: string;
}

function buildDigestMessage(input: {
  weekRange: string;
  averageAttendance: number;
  studentsNeedingAttention: Array<{
    firstName: string;
    lastName: string;
    attendanceRate: number;
    telegramChatId: string;
  }>;
  riskyProjects: Array<{
    studentName: string;
    name: string;
    progress: number;
    risk: string;
  }>;
  filledChatIds: number;
  totalStudents: number;
}) {
  const lines = [
    `Weekly digest: ${input.weekRange}`,
    "",
    `Средняя посещаемость: ${input.averageAttendance}%`,
    `Ученики в зоне внимания: ${input.studentsNeedingAttention.length}`,
    `Проекты в зоне контроля: ${input.riskyProjects.length}`,
    `Заполнено chat id: ${input.filledChatIds}/${input.totalStudents}`,
  ];

  if (input.studentsNeedingAttention.length > 0) {
    lines.push("");
    lines.push("Ученики в зоне внимания:");
    lines.push(
      ...input.studentsNeedingAttention
        .slice(0, 5)
        .map(
          (student) =>
            `- ${student.firstName} ${student.lastName}: ${student.attendanceRate}% посещаемости`,
        ),
    );
  }

  if (input.riskyProjects.length > 0) {
    lines.push("");
    lines.push("Проекты в зоне контроля:");
    lines.push(
      ...input.riskyProjects
        .slice(0, 5)
        .map(
          (project) =>
            `- ${project.studentName} / ${project.name}: ${project.progress}% (${project.risk})`,
        ),
    );
  }

  return lines.join("\n");
}

export async function sendTeacherWeeklyDigest(): Promise<TeacherWeeklyDigestResult> {
  if (!TEACHER_TELEGRAM_CHAT_ID) {
    throw new Error(
      "TEACHER_TELEGRAM_CHAT_ID не настроен. Добавьте chat id преподавателя в переменные окружения.",
    );
  }

  if (!TELEGRAM_CHAT_ID_PATTERN.test(TEACHER_TELEGRAM_CHAT_ID)) {
    throw new Error(
      "TEACHER_TELEGRAM_CHAT_ID должен содержать только цифры и может начинаться с '-'.",
    );
  }

  const [students, projects, attendanceWeek] = await Promise.all([
    listStudents(),
    listProjects(),
    getCurrentAttendanceWeek(),
  ]);

  const studentsNeedingAttention = students.filter(
    (student) => student.weeklyState !== "success",
  );
  const riskyProjects = projects.filter((project) => project.progress < 50);
  const filledChatIds = students.filter((student) =>
    Boolean(student.telegramChatId),
  ).length;
  const averageAttendance = students.length
    ? Math.round(
        students.reduce((total, student) => total + student.attendanceRate, 0) /
          students.length,
      )
    : 0;
  const weekRange = formatWeekRangeLabel(attendanceWeek.weekStart);

  const message = buildDigestMessage({
    weekRange,
    averageAttendance,
    studentsNeedingAttention,
    riskyProjects,
    filledChatIds,
    totalStudents: students.length,
  });

  const sendResult = await sendTelegramMessage(
    TEACHER_TELEGRAM_CHAT_ID,
    message,
  );

  if (!sendResult.ok) {
    throw new Error(sendResult.message);
  }

  return {
    weekRange,
    averageAttendance,
    studentsNeedingAttention: studentsNeedingAttention.length,
    riskyProjects: riskyProjects.length,
    deliveredToChatId: TEACHER_TELEGRAM_CHAT_ID,
  };
}
