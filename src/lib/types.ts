export type WeeklyState = "critical" | "warning" | "success";
export type TelegramLinkStatus = "not_invited" | "awaiting_start" | "linked";
export type AuthRole = "teacher" | "student" | "guest";

export type AuthenticatedSessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string;
  githubLogin: string;
  githubId: string;
  githubAccessToken: string;
};

export type TeacherSessionUser = AuthenticatedSessionUser;

export type StudentSessionUser = AuthenticatedSessionUser & {
  studentId: string;
  studentName: string;
};

export type StudentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  githubUsername: string;
  githubUserId: string;
  telegramUsername: string;
  telegramChatId: string;
  telegramLinkToken: string;
  telegramLinkStatus: TelegramLinkStatus;
  telegramLinkedAt: string;
  attendanceRate: number;
  weeklyState: WeeklyState;
  projectsCount: number;
  lastActivity: string;
  aiSummary: string;
  notes: string;
};

export type StudentInput = {
  firstName: string;
  lastName: string;
  githubUsername: string;
  githubUserId: string;
  telegramUsername: string;
  telegramChatId: string;
  notes: string;
};

export type BulkNotificationStudent = Pick<
  StudentRecord,
  "id" | "firstName" | "lastName" | "telegramChatId" | "telegramUsername"
>;

export type BulkNotificationFailure = {
  studentName: string;
  reason: string;
};

export type BulkNotificationResult = {
  requested: number;
  eligible: number;
  sent: number;
  skippedNoChatId: number;
  skippedInvalidChatId: number;
  failed: BulkNotificationFailure[];
};

export type AttendanceLessonRecord = {
  id: string;
  title: string;
  dateLabel: string;
  lessonDate: string;
  weekStart: string;
  weekdayCode: "tue" | "thu" | "fri";
  attendanceMarked: number;
  missingMarks: number;
  isGenerated: boolean;
  isClosed: boolean;
};

export type AttendanceGridRow = {
  student: StudentRecord;
  lessonStates: Record<string, "present" | "absent" | "unmarked">;
};

export type AttendanceWeekRecord = {
  weekStart: string;
  lessons: AttendanceLessonRecord[];
  rows: AttendanceGridRow[];
  studentsNeedingAttention: StudentRecord[];
};

export type ProjectRisk =
  | "healthy"
  | "invalid_github_repo"
  | "missing_spec"
  | "missing_plan"
  | "stale_repo"
  | "low_progress";

export type ProjectRecord = {
  id: string;
  studentId: string;
  studentName: string;
  name: string;
  summary: string;
  status: string;
  risk: string;
  riskFlags: ProjectRisk[];
  progress: number;
  aiCompletionPercent: number;
  manualCompletionPercent: number | null;
  manualOverrideEnabled: boolean;
  manualOverrideNote: string;
  lastCommit: string;
  lastCommitSha: string;
  lastSyncAt: string;
  lastAiAnalysisAt: string;
  githubUrl: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  specMarkdown: string;
  planMarkdown: string;
  aiSummary: string;
  nextSteps: string[];
};

export type ProjectInput = {
  studentId: string;
  name: string;
  summary: string;
  githubUrl: string;
  status: string;
  specMarkdown: string;
  planMarkdown: string;
};

export type ProjectAiReportRecord = {
  id: string;
  projectId: string;
  sourceCommitSha: string;
  analysisVersion: string;
  modelName: string;
  inputSnapshotJson: string;
  summary: string;
  completionPercent: number;
  implementedItems: string[];
  partialItems: string[];
  missingItems: string[];
  risks: string[];
  nextSteps: string[];
  createdAt: string;
};
