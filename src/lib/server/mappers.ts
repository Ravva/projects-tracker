import type { Models } from "node-appwrite";

import { formatDateLabel } from "@/lib/server/date-utils";
import type {
  AttendanceLessonRecord,
  ProjectAiReportRecord,
  ProjectRecord,
  ProjectRisk,
  StudentInput,
  StudentRecord,
  TelegramLinkStatus,
  WeeklyState,
} from "@/lib/types";

function getField(document: Models.Document, key: string) {
  return (document as Record<string, unknown>)[key];
}

function coerceWeeklyState(value: unknown): WeeklyState {
  if (value === "critical" || value === "warning" || value === "success") {
    return value;
  }

  return "warning";
}

function normalizeRiskFlags(value: unknown): ProjectRisk[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is ProjectRisk => typeof item === "string",
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is ProjectRisk => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeProjectRisk(value: unknown): ProjectRisk {
  if (
    value === "data_missing" ||
    value === "healthy" ||
    value === "invalid_github_repo" ||
    value === "missing_memory_bank" ||
    value === "missing_spec" ||
    value === "missing_plan" ||
    value === "abandoned" ||
    value === "stale_repo" ||
    value === "low_progress"
  ) {
    return value;
  }

  return "healthy";
}

function parseStringList(value: unknown) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function parseObject(value: unknown) {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" ? value : {};
}

function getTelegramLinkStatus(input: {
  telegramChatId: string;
  telegramLinkToken: string;
}): TelegramLinkStatus {
  if (input.telegramChatId) {
    return "linked";
  }

  if (input.telegramLinkToken) {
    return "awaiting_start";
  }

  return "not_invited";
}

export function toStudentDocument(
  input: StudentInput,
): Record<string, string | boolean | number | null> {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    github_username: input.githubUsername,
    github_user_id: input.githubUserId,
    telegram_username: input.telegramUsername,
    telegram_chat_id: input.telegramChatId,
    notes: input.notes,
  };
}

export function mapStudentDocument(
  document: Models.Document,
  summary?: Partial<StudentRecord>,
): StudentRecord {
  const telegramChatId = String(getField(document, "telegram_chat_id") ?? "");
  const telegramLinkToken = String(
    getField(document, "telegram_link_token") ?? "",
  );

  return {
    id: document.$id,
    firstName: String(getField(document, "first_name") ?? ""),
    lastName: String(getField(document, "last_name") ?? ""),
    githubUsername: String(getField(document, "github_username") ?? ""),
    githubUserId: String(getField(document, "github_user_id") ?? ""),
    telegramUsername: String(getField(document, "telegram_username") ?? ""),
    telegramChatId,
    telegramLinkToken,
    telegramLinkStatus: getTelegramLinkStatus({
      telegramChatId,
      telegramLinkToken,
    }),
    telegramLinkedAt: String(getField(document, "telegram_linked_at") ?? ""),
    attendanceRate: summary?.attendanceRate ?? 0,
    weeklyState: coerceWeeklyState(summary?.weeklyState),
    projectsCount: summary?.projectsCount ?? 0,
    lastActivity: summary?.lastActivity ?? "Нет активности",
    aiSummary: summary?.aiSummary ?? "AI summary пока не рассчитан.",
    notes: String(getField(document, "notes") ?? ""),
  };
}

export function mapAttendanceLessonDocument(
  document: Models.Document,
  attendanceMarked = 0,
  missingMarks = 0,
): AttendanceLessonRecord {
  const lessonDate = String(getField(document, "lesson_date") ?? "");
  const weekdayCode = String(getField(document, "weekday_code") ?? "tue");

  return {
    id: document.$id,
    title: String(getField(document, "title") ?? "Занятие"),
    dateLabel: formatDateLabel(lessonDate),
    lessonDate,
    weekStart: String(getField(document, "lesson_week_start") ?? ""),
    weekdayCode:
      weekdayCode === "tue" || weekdayCode === "thu" || weekdayCode === "fri"
        ? weekdayCode
        : "tue",
    attendanceMarked,
    missingMarks,
    isGenerated: Boolean(getField(document, "is_generated") ?? true),
    isClosed: Boolean(getField(document, "is_closed") ?? false),
  };
}

export function mapProjectDocument(
  document: Models.Document,
  studentName: string,
): ProjectRecord {
  const githubState = parseObject(getField(document, "github_state_json")) as {
    owner?: string;
    repo?: string;
    defaultBranch?: string;
    lastCommitAt?: string;
    lastCommitSha?: string;
    lastSyncAt?: string;
  };
  const projectState = parseObject(
    getField(document, "project_state_json"),
  ) as {
    primaryRisk?: string;
    riskFlags?: unknown;
    aiCompletionPercent?: number;
    manualCompletionPercent?: number | null;
    manualOverrideEnabled?: boolean;
    manualOverrideNote?: string;
    lastAiAnalysisAt?: string;
    aiSummary?: string;
    nextSteps?: unknown;
    hasRepository?: boolean;
    hasMemoryBank?: boolean;
    hasSpec?: boolean;
    hasPlan?: boolean;
    trackedTasksTotal?: number;
    trackedTasksCompleted?: number;
    trackedTasksInProgress?: number;
    trackedTasksPending?: number;
    commitCount?: number;
    commitsPerWeek?: number;
    lastCommitDaysAgo?: number | null;
    isAbandoned?: boolean;
  };
  const riskFlags = normalizeRiskFlags(projectState.riskFlags);
  const manualOverrideEnabled = Boolean(
    projectState.manualOverrideEnabled ?? false,
  );
  const lastAiAnalysisAtRaw = String(projectState.lastAiAnalysisAt ?? "");
  const aiCompletionPercent = Number(projectState.aiCompletionPercent ?? 0);
  const manualCompletionPercentRaw = projectState.manualCompletionPercent;
  const manualCompletionPercent =
    manualCompletionPercentRaw === null ||
    manualCompletionPercentRaw === undefined
      ? null
      : Number(manualCompletionPercentRaw);
  const progress =
    manualOverrideEnabled && manualCompletionPercent !== null
      ? manualCompletionPercent
      : aiCompletionPercent;

  return {
    id: document.$id,
    studentId: String(getField(document, "student_id") ?? ""),
    studentName,
    name: String(getField(document, "name") ?? ""),
    summary: String(getField(document, "summary") ?? ""),
    status: String(getField(document, "status") ?? "draft"),
    risk: normalizeProjectRisk(projectState.primaryRisk),
    riskFlags,
    hasAiAnalysisSnapshot: Boolean(lastAiAnalysisAtRaw),
    progress,
    aiCompletionPercent,
    manualCompletionPercent,
    manualOverrideEnabled,
    manualOverrideNote: String(projectState.manualOverrideNote ?? ""),
    hasRepository: Boolean(projectState.hasRepository ?? false),
    hasMemoryBank: Boolean(projectState.hasMemoryBank ?? false),
    hasSpec: Boolean(projectState.hasSpec ?? false),
    hasPlan: Boolean(projectState.hasPlan ?? false),
    trackedTasksTotal: Number(projectState.trackedTasksTotal ?? 0),
    trackedTasksCompleted: Number(projectState.trackedTasksCompleted ?? 0),
    trackedTasksInProgress: Number(projectState.trackedTasksInProgress ?? 0),
    trackedTasksPending: Number(projectState.trackedTasksPending ?? 0),
    commitCount: Number(projectState.commitCount ?? 0),
    commitsPerWeek: Number(projectState.commitsPerWeek ?? 0),
    lastCommitDaysAgo:
      projectState.lastCommitDaysAgo === null ||
      projectState.lastCommitDaysAgo === undefined
        ? null
        : Number(projectState.lastCommitDaysAgo),
    isAbandoned: Boolean(projectState.isAbandoned ?? false),
    lastCommit: String(githubState.lastCommitAt ?? "Нет данных"),
    lastCommitSha: String(githubState.lastCommitSha ?? ""),
    lastSyncAt: String(githubState.lastSyncAt ?? "Нет данных"),
    lastAiAnalysisAt: lastAiAnalysisAtRaw || "Нет данных",
    githubUrl: String(getField(document, "github_url") ?? ""),
    githubOwner: String(githubState.owner ?? ""),
    githubRepo: String(githubState.repo ?? ""),
    defaultBranch: String(githubState.defaultBranch ?? "main"),
    specMarkdown: String(getField(document, "spec_markdown") ?? ""),
    planMarkdown: String(getField(document, "plan_markdown") ?? ""),
    aiSummary: String(projectState.aiSummary ?? ""),
    nextSteps: parseStringList(projectState.nextSteps),
  };
}

export function mapProjectAiReportDocument(
  document: Models.Document,
): ProjectAiReportRecord {
  const payload = parseObject(getField(document, "report_payload_json")) as {
    inputSnapshotJson?: string;
    implementedItems?: unknown;
    partialItems?: unknown;
    missingItems?: unknown;
    risks?: unknown;
    nextSteps?: unknown;
    sourceFiles?: unknown;
    hasRepository?: boolean;
    hasMemoryBank?: boolean;
    hasSpec?: boolean;
    hasPlan?: boolean;
    trackedTasksTotal?: number;
    trackedTasksCompleted?: number;
    trackedTasksInProgress?: number;
    trackedTasksPending?: number;
    commitCount?: number;
    commitsPerWeek?: number;
    lastCommitDaysAgo?: number | null;
    isAbandoned?: boolean;
  };

  return {
    id: document.$id,
    projectId: String(getField(document, "project_id") ?? ""),
    sourceCommitSha: String(getField(document, "source_commit_sha") ?? ""),
    analysisVersion: String(getField(document, "analysis_version") ?? ""),
    modelName: String(getField(document, "model_name") ?? ""),
    inputSnapshotJson: String(payload.inputSnapshotJson ?? "{}"),
    summary: String(getField(document, "summary") ?? ""),
    completionPercent: Number(getField(document, "completion_percent") ?? 0),
    hasRepository: Boolean(payload.hasRepository ?? false),
    hasMemoryBank: Boolean(payload.hasMemoryBank ?? false),
    hasSpec: Boolean(payload.hasSpec ?? false),
    hasPlan: Boolean(payload.hasPlan ?? false),
    trackedTasksTotal: Number(payload.trackedTasksTotal ?? 0),
    trackedTasksCompleted: Number(payload.trackedTasksCompleted ?? 0),
    trackedTasksInProgress: Number(payload.trackedTasksInProgress ?? 0),
    trackedTasksPending: Number(payload.trackedTasksPending ?? 0),
    commitCount: Number(payload.commitCount ?? 0),
    commitsPerWeek: Number(payload.commitsPerWeek ?? 0),
    lastCommitDaysAgo:
      payload.lastCommitDaysAgo === null ||
      payload.lastCommitDaysAgo === undefined
        ? null
        : Number(payload.lastCommitDaysAgo),
    isAbandoned: Boolean(payload.isAbandoned ?? false),
    implementedItems: parseStringList(payload.implementedItems),
    partialItems: parseStringList(payload.partialItems),
    missingItems: parseStringList(payload.missingItems),
    risks: parseStringList(payload.risks),
    nextSteps: parseStringList(payload.nextSteps),
    sourceFiles: parseStringList(payload.sourceFiles),
    createdAt: document.$createdAt,
  };
}
