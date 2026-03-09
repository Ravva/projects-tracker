import type { Models } from "node-appwrite";

import type {
  AttendanceLessonRecord,
  ProjectRecord,
  StudentRecord,
  WeeklyState,
} from "@/lib/types";

function coerceWeeklyState(value: unknown): WeeklyState {
  if (value === "critical" || value === "warning" || value === "success") {
    return value;
  }

  return "warning";
}

function getField(document: Models.Document, key: string) {
  return (document as Record<string, unknown>)[key];
}

export function mapStudentDocument(
  document: Models.Document,
  projectsCount = 0,
): StudentRecord {
  return {
    id: document.$id,
    firstName: String(getField(document, "first_name") ?? ""),
    lastName: String(getField(document, "last_name") ?? ""),
    githubUsername: String(getField(document, "github_username") ?? ""),
    githubUserId: String(getField(document, "github_user_id") ?? ""),
    telegramUsername: String(getField(document, "telegram_username") ?? ""),
    telegramChatId: String(getField(document, "telegram_chat_id") ?? ""),
    attendanceRate: Number(getField(document, "attendance_rate") ?? 0),
    weeklyState: coerceWeeklyState(getField(document, "weekly_state")),
    projectsCount,
    lastActivity: String(getField(document, "last_activity") ?? "Нет данных"),
    aiSummary: String(
      getField(document, "ai_summary") ?? "AI summary пока не рассчитан.",
    ),
    notes: String(getField(document, "notes") ?? ""),
  };
}

export function mapProjectDocument(document: Models.Document): ProjectRecord {
  const nextStepsRaw = getField(document, "next_steps_json");
  const nextSteps = Array.isArray(nextStepsRaw)
    ? nextStepsRaw.map((item) => String(item))
    : [];

  return {
    id: document.$id,
    studentName: String(getField(document, "student_name") ?? ""),
    name: String(getField(document, "name") ?? ""),
    status: String(getField(document, "status") ?? "planning"),
    risk: String(getField(document, "primary_risk") ?? "Нет данных"),
    progress: Number(
      getField(document, "final_completion_percent") ??
        getField(document, "ai_completion_percent") ??
        0,
    ),
    lastCommit: String(getField(document, "last_commit_at") ?? "Нет данных"),
    githubUrl: String(getField(document, "github_url") ?? ""),
    githubOwner: String(getField(document, "github_owner") ?? ""),
    githubRepo: String(getField(document, "github_repo") ?? ""),
    defaultBranch: String(getField(document, "default_branch") ?? "main"),
    specMarkdown: String(getField(document, "spec_markdown") ?? ""),
    planMarkdown: String(getField(document, "plan_markdown") ?? ""),
    aiSummary: String(getField(document, "ai_summary") ?? ""),
    nextSteps,
  };
}

export function mapAttendanceLessonDocument(
  document: Models.Document,
): AttendanceLessonRecord {
  return {
    id: document.$id,
    title: String(
      getField(document, "title") ??
        getField(document, "weekday_code") ??
        "Занятие",
    ),
    dateLabel: String(
      getField(document, "date_label") ??
        getField(document, "lesson_date") ??
        "",
    ),
    attendanceMarked: Number(getField(document, "attendance_marked") ?? 0),
    missingMarks: Number(getField(document, "missing_marks") ?? 0),
  };
}
