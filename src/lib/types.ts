export type WeeklyState = "critical" | "warning" | "success";
export type TelegramLinkStatus = "not_invited" | "awaiting_start" | "linked";
export type AuthRole = "teacher" | "student" | "guest";
export type ProjectStatus = "draft" | "active" | "completed";
export type ProjectSyncStatus =
  | "unknown"
  | "synced"
  | "sync_needed"
  | "unavailable";
export type ProjectAiStatus =
  | "not_started"
  | "up_to_date"
  | "outdated"
  | "status_unknown";

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
  activeProjectsCount: number;
  completedProjectsCount: number;
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
  | "data_missing"
  | "healthy"
  | "invalid_github_repo"
  | "missing_memory_bank"
  | "missing_spec"
  | "missing_plan"
  | "abandoned"
  | "stale_repo"
  | "low_progress";

export type ProjectRepositoryMetrics = {
  hasRepository: boolean;
  hasMemoryBank: boolean;
  hasSpec: boolean;
  hasPlan: boolean;
  trackedTasksTotal: number;
  trackedTasksCompleted: number;
  trackedTasksInProgress: number;
  trackedTasksPending: number;
  commitCount: number;
  commitsPerWeek: number;
  lastCommitDaysAgo: number | null;
  isAbandoned: boolean;
};

export type ProjectRecord = ProjectRepositoryMetrics & {
  id: string;
  studentId: string;
  studentName: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  risk: ProjectRisk;
  riskFlags: ProjectRisk[];
  hasAiAnalysisSnapshot: boolean;
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
  syncStatus: ProjectSyncStatus;
  syncStatusReason: string;
  aiStatus: ProjectAiStatus;
  remoteLastCommit: string;
  remoteLastCommitSha: string;
};

export type ProjectInput = {
  studentId: string;
  name: string;
  summary: string;
  githubUrl: string;
  status: ProjectStatus;
  specMarkdown: string;
  planMarkdown: string;
};

export type ProjectAiReportRecord = ProjectRepositoryMetrics & {
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
  sourceFiles: string[];
  createdAt: string;
};
